import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { equipoKpiGuard } from './equipo-kpi.guard';

describe('Acceso a KPI de equipo', () => {
  const auth = { getUsuarioSesion: vi.fn() };
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  }));
  function comprobar() {
    return TestBed.runInInjectionContext(() => equipoKpiGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ));
  }
  it.each([2, 3, 4])('permite el nivel %i con empleado asociado', nivelJerarquico => {
    auth.getUsuarioSesion.mockReturnValue({ idEmpleado: 22, nivelJerarquico });
    expect(comprobar()).toBe(true);
  });
  it.each([1, 0, 5])('redirige el nivel %i al dashboard personal', nivelJerarquico => {
    auth.getUsuarioSesion.mockReturnValue({ idEmpleado: 22, nivelJerarquico });
    expect(comprobar()).toEqual(TestBed.inject(Router).createUrlTree(['/kpis/mi-desempeno']));
  });
  it('no permite usuarios sin empleado asociado', () => {
    auth.getUsuarioSesion.mockReturnValue({ idEmpleado: null, nivelJerarquico: 2 });
    expect(comprobar()).not.toBe(true);
  });
  it('redirige al login cuando no hay sesión válida', () => {
    auth.getUsuarioSesion.mockReturnValue(null);
    expect(comprobar()).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
  });
});