import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from '../../../../core/interceptors/auth-interceptor';
import { KpiDashboard } from './kpi-dashboard';
import { DashboardKpi } from '../../models/dashboard-kpi.model';

describe('Dashboard KPI', () => {
  let http: HttpTestingController;
  const vacio: DashboardKpi = {
    idEmpleado: 22, periodo: { anio: 2026, mes: 8, fechaInicial: '2026-08-01', fechaFinal: '2026-08-31' },
    tieneDatos: false, ultimaCargaDiaria: null, diasConDatos: 0, evaluaciones: [], seriesDiarias: [],
  };
  beforeEach(() => {
    localStorage.setItem('access_token', 'token-de-prueba');
    TestBed.configureTestingModule({
      imports: [KpiDashboard],
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  function abrir() {
    const fixture = TestBed.createComponent(KpiDashboard);
    fixture.componentInstance.anio = 2026;
    fixture.componentInstance.mes = 8;
    fixture.detectChanges();
    const req = http.expectOne(r => r.url.endsWith('/kpi/mi-dashboard'));
    return { fixture, component: fixture.componentInstance, req };
  }

  it('consulta el período con JWT y muestra el estado vacío sin inventar notas', () => {
    const { fixture, req } = abrir();
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(req.request.params.get('anio')).toBe('2026');
    expect(req.request.params.get('mes')).toBe('8');
    expect(req.request.params.has('idEmpleado')).toBe(false);
    req.flush(vacio); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay información');
    expect(fixture.nativeElement.textContent).not.toContain('Nota guardada');
  });

  it('muestra cumplimiento guardado, valores cero y ausencia de rangos sin recalcularlos', () => {
    const { fixture, req } = abrir();
    req.flush({ ...vacio, tieneDatos: true, evaluaciones: [{
      idEvaluacion: 1, idDepartamento: 3, estado: 'CALCULADA', puntajeBase: 11.25,
      penalizacionTotal: 0, notaFinal: 11.25, metaGlobal: null, calculadaEn: '2026-09-01T12:00:00Z',
      resultados: [
        { idResultado: 1, idMetrica: 1, codigo: 'BOD_FACTURAS', nombre: 'Facturas', valorObtenido: 126, metaAplicada: 231, porcentajeCumplimiento: 75, puntosObtenidos: 11.25, detalles: [] },
        { idResultado: 2, idMetrica: 2, nombre: 'Líneas', valorObtenido: 0, metaAplicada: 0, porcentajeCumplimiento: null, puntosObtenidos: 0, detalles: [] },
      ],
    }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('75%');
    expect(fixture.nativeElement.textContent).toContain('Sin rango');
    expect(fixture.nativeElement.textContent).toContain('Meta aplicada: 0');
    expect(fixture.nativeElement.textContent).not.toContain('54.55');
  });

  it('muestra actividad diaria aunque todavía no haya evaluación', () => {
    const { fixture, component, req } = abrir();
    req.flush({ ...vacio, tieneDatos: true, diasConDatos: 1, seriesDiarias: [
      { idMetrica: 1, nombre: 'Facturas', codigo: 'BOD_FACTURAS', unidadMedida: 'facturas', puntos: [{ fecha: '2026-08-01', valor: 0 }] },
    ] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Evaluación mensual pendiente');
    expect(fixture.nativeElement.textContent).toContain('01/08/2026');
    expect(component.ancho(0)).toBe(0);
  });

  it('cancela respuestas anteriores al cambiar de período', () => {
    const { component, req } = abrir();
    component.mes = 7; component.cargar();
    expect(req.cancelled).toBe(true);
    http.expectOne(r => r.params.get('mes') === '7').flush({ ...vacio, periodo: { ...vacio.periodo, mes: 7 } });
    expect(component.datos()?.periodo.mes).toBe(7);
  });

  it('maneja 403 y permite reintentar sin mostrar datos anteriores', () => {
    const { component, req } = abrir();
    req.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(component.error()).toContain('empleado activo');
    expect(component.datos()).toBeNull();
    component.cargar();
    http.expectOne(r => r.url.endsWith('/kpi/mi-dashboard')).flush(vacio);
    expect(component.error()).toBe('');
  });

  it('redirige al login cuando expira el token', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { req } = abrir();
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
