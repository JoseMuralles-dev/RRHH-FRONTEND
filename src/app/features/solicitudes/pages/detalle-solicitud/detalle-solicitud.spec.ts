import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { DetalleSolicitud } from './detalle-solicitud';
import { Solicitud } from '../../models/solicitud.model';

const solicitud: Solicitud = { idSolicitud: 7, idEmpleado: 10, idTipoIncidencia: 1, motivo: 'Motivo', fechaInicio: '2026-09-18', fechaFin: '2026-09-21', diasSolicitados: 2,
  estado: 'PENDIENTE', isActive: true, createdAt: '2026-09-17T12:00:00Z', aprobaciones: [
    { idAprobacion: 1, idSolicitud: 7, idUsuarioAprobador: 20, nivelAprobacion: 1, estado: 'PENDIENTE' },
    { idAprobacion: 2, idSolicitud: 7, idUsuarioAprobador: 30, nivelAprobacion: 2, estado: 'PENDIENTE' },
  ] };
describe('DetalleSolicitud', () => {
  let http: HttpTestingController;
  function setup(idUsuario = 20, idEmpleado = 20, estado: Solicitud['estado'] = 'PENDIENTE') {
    TestBed.configureTestingModule({ imports: [DetalleSolicitud], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      { provide: AuthService, useValue: { getUsuarioSesion: () => ({ idUsuario, idEmpleado, nivelJerarquico: 2 }) } }] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(DetalleSolicitud); fixture.detectChanges();
    http.expectOne('http://localhost:3000/solicitudes/7').flush({ ...solicitud, estado });
    fixture.detectChanges(); return fixture;
  }
  afterEach(() => { http.verify(); vi.restoreAllMocks(); });
  it('requires rejection comments and refreshes detail after one submission', () => {
    const fixture = setup(); const component = fixture.componentInstance;
    expect(component.puedeResolver()).toBe(true);
    component.resolver('rechazar'); http.expectNone(req => req.method === 'PATCH');
    expect(component.error()).toContain('motivo del rechazo');
    component.comentario.setValue(' No procede ');
    component.resolver('rechazar'); component.resolver('rechazar');
    const req = http.expectOne('http://localhost:3000/solicitudes/7/rechazar');
    expect(req.request.body).toEqual({ comentario: 'No procede' }); req.flush({});
    http.expectOne('http://localhost:3000/solicitudes/7').flush({ ...solicitud, estado: 'RECHAZADA' });
    expect(component.puedeResolver()).toBe(false);
  });
  it('hides RRHH approval until its turn', () => {
    const fixture = setup(30, 30); expect(fixture.componentInstance.puedeResolver()).toBe(false);
    fixture.componentInstance.resolver('aprobar'); http.expectNone(req => req.method === 'PATCH');
  });
  it('hides all actions on cancelled requests', () => {
    const fixture = setup(20, 20, 'CANCELADA'); expect(fixture.componentInstance.puedeResolver()).toBe(false);
    expect(fixture.componentInstance.puedeCancelar()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('solicitud cerrada');
  });
  it('asks the owner for confirmation before cancelling', () => {
    const fixture = setup(10, 10); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.resolver('cancelar'); http.expectNone(req => req.method === 'PATCH');
    confirm.mockReturnValue(true); fixture.componentInstance.resolver('cancelar');
    const req = http.expectOne('http://localhost:3000/solicitudes/7/cancelar'); expect(req.request.body).toBeNull(); req.flush({});
    http.expectOne('http://localhost:3000/solicitudes/7').flush({ ...solicitud, estado: 'CANCELADA' });
    expect(fixture.componentInstance.puedeCancelar()).toBe(false);
  });
});
