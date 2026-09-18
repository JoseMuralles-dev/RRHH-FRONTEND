import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { CrearSolicitud } from './crear-solicitud';

describe('CrearSolicitud', () => {
  let http: HttpTestingController;
  const auth = { getUsuarioSesion: () => ({ idUsuario: 1, idEmpleado: 10, nivelJerarquico: 1 }) };
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CrearSolicitud], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: auth }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); vi.restoreAllMocks(); });
  it('loads the catalog, blocks duplicate saves and opens the created detail', () => {
    const fixture = TestBed.createComponent(CrearSolicitud); fixture.detectChanges();
    http.expectOne('http://localhost:3000/solicitudes/tipos-incidencia').flush([{ idTipoIncidencia: 1, nombre: 'Permiso', requierePeriodo: true }]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const data = { idTipoIncidencia: 1, fechaInicio: '2026-09-18', fechaFin: '2026-09-21', diasSolicitados: 2, motivo: 'Motivo' };
    fixture.componentInstance.guardar(data); fixture.componentInstance.guardar(data);
    const req = http.expectOne('http://localhost:3000/solicitudes');
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual(data);
    req.flush({ idSolicitud: 7 });
    expect(navigate).toHaveBeenCalledWith(['/solicitudes', 7]);
  });
  it('shows catalog errors rather than an empty list', () => {
    const fixture = TestBed.createComponent(CrearSolicitud); fixture.detectChanges();
    http.expectOne('http://localhost:3000/solicitudes/tipos-incidencia').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo conectar');
    expect(fixture.nativeElement.querySelector('app-solicitud-form')).toBeNull();
  });
  it('does not request a catalog for an account without an employee', () => {
    vi.spyOn(auth, 'getUsuarioSesion').mockReturnValue({ idUsuario: 1, idEmpleado: null as unknown as number, nivelJerarquico: 4 });
    const fixture = TestBed.createComponent(CrearSolicitud); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no tiene un empleado asociado');
    http.expectNone(() => true);
  });
});
