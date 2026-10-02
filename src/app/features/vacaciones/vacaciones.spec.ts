import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { AuthService } from '../../core/services/auth';
import { Vacaciones } from './vacaciones';

describe('Pantalla de vacaciones', () => {
  let http: HttpTestingController;
  const registro = { idSolicitud: 15, fechaInicio: '2026-10-05', fechaFin: '2026-10-09',
    diasSolicitados: 5, motivo: 'Descanso', estadoSolicitud: 'APROBADA',
    fechaResolucion: null, nombreTipo: 'Descanso anual' };
  const respuesta = { anio: 2026, pendientes: [], aprobadas: [registro], rechazadas: [], canceladas: [] };
  beforeEach(() => {
    localStorage.setItem('access_token', 'token-prueba');
    TestBed.configureTestingModule({ imports: [Vacaciones], providers: [
      provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
      { provide: AuthService, useValue: { logout: () => {} } },
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.removeItem('access_token'); });
  function abrir() {
    const fixture = TestBed.createComponent(Vacaciones);
    fixture.detectChanges();
    const req = http.expectOne(r => r.url.endsWith('/mis-vacaciones'));
    return { fixture, req, component: fixture.componentInstance };
  }
  it('envia el JWT sin idEmpleado y muestra la respuesta sin otro clic', async () => {
    const { fixture, req } = abrir();
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-prueba');
    expect(req.request.params.has('idEmpleado')).toBe(false);
    req.flush(respuesta);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Descanso anual');
    expect(fixture.nativeElement.textContent).toContain('05/10/2026');
    expect(fixture.nativeElement.textContent).not.toContain('Cargando vacaciones');
  });
  it('incluye EN_REVISION al filtrar pendientes', () => {
    const { component, req } = abrir();
    req.flush({ ...respuesta, pendientes: [{ ...registro, idSolicitud: 16, estadoSolicitud: 'EN_REVISION' }] });
    component.estado.set('PENDIENTE');
    expect(component.visibles().map(r => r.idSolicitud)).toEqual([16]);
  });
  it('consulta proximas sin limitar el anio', () => {
    const { component, req } = abrir();
    req.flush(respuesta);
    component.cambiarVista('proximas');
    const next = http.expectOne('http://localhost:3000/vacaciones/proximas');
    next.flush([registro]);
    expect(component.visibles()).toEqual([registro]);
  });
  it('consulta historial del anio elegido', () => {
    const { component, req } = abrir();
    req.flush(respuesta);
    component.anio = 2025;
    component.cambiarVista('historial');
    http.expectOne('http://localhost:3000/vacaciones/historial?anio=2025').flush({ anio: 2025, solicitudes: [] });
    expect(component.visibles()).toEqual([]);
  });
  it('cancela la consulta anterior al cambiar de vista', () => {
    const { component, req } = abrir();
    component.cambiarVista('proximas');
    expect(req.cancelled).toBe(true);
    http.expectOne('http://localhost:3000/vacaciones/proximas').flush([]);
    expect(component.cargando()).toBe(false);
  });
  it('presenta el error de empleado y permite reintentar', () => {
    const { component, req } = abrir();
    req.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(component.error()).toContain('empleado activo asociado');
    component.cargar();
    http.expectOne(r => r.url.endsWith('/mis-vacaciones')).flush(respuesta);
    expect(component.error()).toBe('');
    expect(component.visibles()).toHaveLength(1);
  });
});
