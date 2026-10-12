import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from '../../../core/interceptors/auth-interceptor';
import { AuthService } from '../../../core/services/auth';
import { ExpedienteService } from './expediente.service';
import { documento, expediente, tipo } from '../testing/fixtures';
import { API } from '../../../core/config/apis';
const base = API.baseUrl + API.expedientes.base;
describe('ExpedienteService', () => {
  let http: HttpTestingController; let service: ExpedienteService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(ExpedienteService); localStorage.setItem('access_token', 'prueba');
  });
  afterEach(() => { http.verify(); localStorage.removeItem('access_token'); });
  it('consulta las rutas existentes y crea el expediente con el DTO', () => {
    service.obtenerExpedienteEmpleado(10).subscribe(e => expect(e.idExpediente).toBe(7)); http.expectOne(base + '/empleado/10').flush(expediente);
    service.listarTiposDocumento().subscribe(); http.expectOne(base + '/tipos-documento').flush([tipo]);
    service.crearExpediente({ idEmpleado: 10, fechaApertura: '2026-10-05' }).subscribe();
    const req = http.expectOne(base); expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual({ idEmpleado: 10, fechaApertura: '2026-10-05' }); req.flush(expediente);
  });
  it('envía archivo y campos multipart sin fijar Content-Type ni fechas vacías', () => {
    const archivo = new File(['pdf'], 'dpi.pdf', { type: 'application/pdf' });
    service.subirDocumento(7, archivo, { idTipoDocumento: 1, fechaDocumento: '', observaciones: ' Revisión ' }).subscribe();
    const req = http.expectOne(base + '/7/documentos'); const form = req.request.body as FormData;
    expect(req.request.headers.get('Authorization')).toBe('Bearer prueba'); expect(req.request.headers.has('Content-Type')).toBe(false);
    expect(form.get('archivo')).toBe(archivo); expect(form.get('idTipoDocumento')).toBe('1'); expect(form.has('fechaDocumento')).toBe(false); expect(form.has('fechaVencimiento')).toBe(false); expect(form.get('observaciones')).toBe('Revisión'); req.flush(documento);
  });
  it('descarga Blob únicamente por el endpoint protegido', () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' }); const recibido = vi.fn();
    service.descargarDocumento(7, 9).subscribe(recibido); const req = http.expectOne(base + '/7/documentos/9/descargar');
    expect(req.request.responseType).toBe('blob'); expect(req.request.headers.get('Authorization')).toBe('Bearer prueba'); req.flush(blob); expect(recibido).toHaveBeenCalledWith(blob);
  });
  it('deja disponibles los contratos de edición y desactivación sin rutas públicas', () => {
    service.actualizarDocumento(9, { observaciones: 'Actualizado' }).subscribe(); const patch = http.expectOne(base + '/documentos/9'); expect(patch.request.method).toBe('PATCH'); patch.flush(documento);
    service.eliminarDocumento(9).subscribe(); const del = http.expectOne(base + '/documentos/9'); expect(del.request.method).toBe('DELETE'); del.flush(null);
  });
  it('reemplaza el archivo por multipart y permite limpiar observaciones', () => {
    const archivo = new File(['%PDF-1.4'], 'nuevo.pdf', { type: 'application/pdf' });
    service.actualizarDocumento(9, { observaciones: '' }, archivo).subscribe();
    const req = http.expectOne(base + '/documentos/9');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.get('archivo')).toBe(archivo);
    expect(req.request.body.get('observaciones')).toBe('');
    expect(req.request.headers.has('Content-Type')).toBe(false);
    req.flush(documento);
  });
  it('limpia la sesión ante 401', async () => {
    const logout = vi.spyOn(TestBed.inject(AuthService), 'logout'); const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.obtenerExpedienteEmpleado(10).subscribe({ error: () => {} }); http.expectOne(base + '/empleado/10').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve(); expect(logout).toHaveBeenCalled(); expect(nav).toHaveBeenCalledWith(['/login']);
  });
  it('previsualiza usando el expediente y el token de sesion', () => {
    service.previsualizarDocumento(7, 9).subscribe();
    const req = http.expectOne(base + '/7/documentos/9/previsualizar');
    expect(req.request.responseType).toBe('blob'); expect(req.request.headers.get('Authorization')).toBe('Bearer prueba');
    req.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });
});
