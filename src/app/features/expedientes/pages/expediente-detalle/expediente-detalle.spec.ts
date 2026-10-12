import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { ExpedienteDetalle } from './expediente-detalle';
import { documento, expediente, tipo } from '../../testing/fixtures';
import { API } from '../../../../core/config/apis';
const base = API.baseUrl;
describe('ExpedienteDetalle', () => {
  let http: HttpTestingController;
  function abrir() {
    TestBed.configureTestingModule({ imports: [ExpedienteDetalle], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ idEmpleado: '10' })) } }, { provide: AuthService, useValue: { getNivelJerarquico: () => 3, logout: vi.fn() } }] });
    http = TestBed.inject(HttpTestingController); const f = TestBed.createComponent(ExpedienteDetalle);
    http.expectOne(base + '/empleados/10').flush({ idEmpleado: 10, primerNombre: 'Ana', primerApellido: 'Pérez' }); return f;
  }
  afterEach(() => { http.verify(); vi.restoreAllMocks(); });
  it('muestra faltantes sin contar documentos inactivos ni duplicar tipos', async () => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush({ ...expediente, documentos: [documento, { ...documento, idDocumento: 11 }, { ...documento, idDocumento: 12, idTipoDocumento: 2, isActive: false }] });
    http.expectOne(base + '/expedientes/tipos-documento').flush([tipo, { ...tipo, idTipoDocumento: 2, nombre: 'Contrato' }]);
    await f.whenStable(); expect(f.componentInstance.completos()).toBe(1); expect(f.componentInstance.documentos()).toHaveLength(2); expect(f.nativeElement.textContent).toContain('Falta · Contrato'); expect(f.nativeElement.textContent).toContain('Ana Pérez');
  });
  it('ofrece crear solo al recibir ausencia, y refresca después del POST', async () => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush({}, { status: 404, statusText: 'Not Found' }); http.expectOne(base + '/expedientes/tipos-documento').flush([tipo]);
    await f.whenStable(); expect(f.componentInstance.noExiste()).toBe(true);
    f.componentInstance.crear(); const req = http.expectOne(base + '/expedientes'); expect(req.request.body.idEmpleado).toBe(10); req.flush(expediente);
    http.expectOne(base + '/expedientes/empleado/10').flush(expediente); http.expectOne(base + '/expedientes/tipos-documento').flush([tipo]); http.expectOne(base + '/empleados/10').flush({ primerNombre: 'Ana', primerApellido: 'Pérez' });
    expect(f.componentInstance.noExiste()).toBe(false);
  });
  it('un 403 no se interpreta como expediente inexistente y termina el loader', async () => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush({}, { status: 403, statusText: 'Forbidden' }); http.expectOne(base + '/expedientes/tipos-documento').flush([tipo]);
    await f.whenStable(); expect(f.componentInstance.noExiste()).toBe(false); expect(f.componentInstance.loading()).toBe(false); expect(f.componentInstance.error()).toContain('permiso');
  });
  it('conserva documentos aunque falle el catálogo y no declara completos falsos', async () => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush(expediente); http.expectOne(base + '/expedientes/tipos-documento').flush({}, { status: 500, statusText: 'Error' });
    await f.whenStable(); expect(f.componentInstance.documentos()).toHaveLength(1); expect(f.componentInstance.tipos()).toBeNull(); expect(f.nativeElement.textContent).toContain('Sin información');
  });
  it.each(['application/pdf', 'image/png', 'image/jpeg'])('previsualiza %s y libera la URL al cerrar', async mime => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush(expediente); http.expectOne(base + '/expedientes/tipos-documento').flush([tipo]);
    await f.whenStable();
    const dialog = f.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn(() => { dialog.open = true; }); dialog.close = vi.fn(() => { dialog.open = false; });
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('http://localhost/preview.pdf');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const button = [...f.nativeElement.querySelectorAll('app-documento-card button')].find((b: any) => b.textContent.trim() === 'Previsualizar') as HTMLButtonElement;
    expect(button.disabled).toBe(false); button.click();
    const req = http.expectOne(base + '/expedientes/7/documentos/9/previsualizar'); expect(req.request.responseType).toBe('blob');
    const blob = new Blob(['contenido'], { type: mime }); req.flush(blob); await f.whenStable();
    expect(create).toHaveBeenCalledWith(blob); expect(dialog.querySelector(mime === 'application/pdf' ? 'iframe' : 'img')).not.toBeNull();
    f.componentInstance.cerrarVista(); expect(revoke).toHaveBeenCalledWith('http://localhost/preview.pdf'); expect(f.componentInstance.vista()).toBeNull(); expect(dialog.open).toBe(false);
  });
  it('cancela la carga de la vista al cerrar', async () => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush(expediente); http.expectOne(base + '/expedientes/tipos-documento').flush([tipo]); await f.whenStable();
    const dialog = f.nativeElement.querySelector('dialog'); dialog.showModal = vi.fn();
    f.componentInstance.previsualizar(documento); const req = http.expectOne(base + '/expedientes/7/documentos/9/previsualizar');
    f.componentInstance.cerrarVista(); expect(req.cancelled).toBe(true); expect(f.componentInstance.cargandoVista()).toBe(false);
  });
  it('muestra errores en el visor sin crear una URL', async () => {
    const f = abrir(); http.expectOne(base + '/expedientes/empleado/10').flush(expediente); http.expectOne(base + '/expedientes/tipos-documento').flush([tipo]); await f.whenStable();
    f.nativeElement.querySelector('dialog').showModal = vi.fn();
    f.componentInstance.previsualizar(documento); http.expectOne(base + '/expedientes/7/documentos/9/previsualizar').flush(null, { status: 404, statusText: 'Not Found' });
    await f.whenStable(); expect(f.componentInstance.errorVista()).toContain('no está disponible'); expect(f.componentInstance.vista()).toBeNull();
  });
});
