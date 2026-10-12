import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { SubirDocumento } from './subir-documento';
import { documento, expediente, tipo } from '../../testing/fixtures';
describe('SubirDocumento', () => {
  let http: HttpTestingController;
  function abrir(idExpediente = '7') {
    TestBed.configureTestingModule({ imports: [SubirDocumento], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ idExpediente })), queryParamMap: of(convertToParamMap({ idEmpleado: '10' })) } },
      { provide: AuthService, useValue: { getNivelJerarquico: () => 3, logout: vi.fn() } }] });
    http = TestBed.inject(HttpTestingController); const f = TestBed.createComponent(SubirDocumento);
    http.expectOne('http://localhost:3000/expedientes/empleado/10').flush(expediente); http.expectOne('http://localhost:3000/expedientes/tipos-documento').flush([tipo, { ...tipo, idTipoDocumento: 2, requiereVencimiento: false }]); f.detectChanges(); return f;
  }
  afterEach(() => http.verify());
  it('exige vencimiento según catálogo y actualiza validadores al cambiar tipo', () => {
    const f = abrir(); const c = f.componentInstance; c.form.controls.idTipoDocumento.setValue(1); expect(c.form.controls.fechaVencimiento.invalid).toBe(true);
    c.form.controls.idTipoDocumento.setValue(2); expect(c.form.controls.fechaVencimiento.valid).toBe(true);
  });
  it('sube multipart una sola vez y vuelve al empleado verificado', () => {
    const f = abrir(); const c = f.componentInstance;
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const input: HTMLInputElement = f.nativeElement.querySelector('#archivo');
    Object.defineProperty(input, 'files', { value: [new File(['pdf'], 'dpi.pdf', { type: 'application/pdf' })] }); input.dispatchEvent(new Event('change'));
    c.form.patchValue({ idTipoDocumento: 1, fechaVencimiento: '2027-10-05' }); c.guardar(); c.guardar();
    const req = http.expectOne('http://localhost:3000/expedientes/7/documentos'); expect(req.request.body.get('fechaVencimiento')).toBe('2027-10-05'); expect(req.request.body.get('archivo').name).toBe('dpi.pdf'); req.flush(documento);
    expect(nav).toHaveBeenCalledWith(['/expedientes/empleado', 10]); expect(c.success()).toContain('guardado'); expect(c.archivo()).toBeNull();
  });
  it('no sube a un expediente que no corresponde al empleado', () => { const f = abrir('99'); expect(f.componentInstance.verificado()).toBe(false); f.componentInstance.guardar(); http.expectNone(r => r.method === 'POST'); expect(f.componentInstance.error()).toContain('no corresponde'); });
  it('conserva el formulario y libera el botón después de error', async () => {
    const f = abrir(); const c = f.componentInstance; c.archivo.set(new File(['pdf'], 'dpi.pdf', { type: 'application/pdf' })); c.form.patchValue({ idTipoDocumento: 2, observaciones: 'Conservar' }); c.guardar();
    http.expectOne('http://localhost:3000/expedientes/7/documentos').flush({ message: 'Carga rechazada' }, { status: 400, statusText: 'Bad Request' });
    await f.whenStable(); expect(c.saving()).toBe(false); expect(c.form.controls.observaciones.value).toBe('Conservar'); expect(c.error()).toContain('Carga rechazada');
  });
});
