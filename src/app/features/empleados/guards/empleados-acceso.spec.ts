import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { permisoEmpleado } from './permiso-empleado';
import { EmpleadoDetalle } from '../pages/empleado-detalle/empleado-detalle';

describe('Acceso y detalle de empleados', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [EmpleadoDetalle],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } }],
  }));
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.restoreAllMocks(); });

  function token(nivel: number, exp = Math.floor(Date.now() / 1000) + 3600) {
    vi.spyOn(TestBed.inject(AuthService), 'getToken').mockReturnValue(
      `header.${btoa(JSON.stringify({ nivelJerarquico: nivel, exp }))}.signature`);
  }
  function acceso(nivel: number) {
    return TestBed.runInInjectionContext(() => permisoEmpleado(
      { data: { nivel } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }

  it('allows level 2 to read but only level 3 to edit', () => {
    token(2);
    expect(acceso(2)).toBe(true);
    expect((acceso(3) as UrlTree).toString()).toBe('/empleados/sin-acceso');
    token(3);
    expect(acceso(3)).toBe(true);
  });

  it('redirects missing sessions and rejects expired or malformed tokens', () => {
    vi.spyOn(TestBed.inject(AuthService), 'getToken').mockReturnValue(null);
    expect((acceso(2) as UrlTree).toString()).toBe('/login');
    token(3, 1);
    expect(TestBed.inject(AuthService).getNivelJerarquico()).toBe(0);
    vi.spyOn(TestBed.inject(AuthService), 'getToken').mockReturnValue('invalid');
    expect(TestBed.inject(AuthService).getNivelJerarquico()).toBe(0);
  });

  it('renders detail safely without optional relations and hides edit at level 2', () => {
    token(2);
    const fixture = TestBed.createComponent(EmpleadoDetalle);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('http://localhost:3000/empleados/7').flush({
      idEmpleado: 7, idPuesto: 1, primerNombre: 'Ana', primerApellido: 'Pérez',
      dpi: '0012345678901', igss: '00123', fechaNacimiento: '1995-05-20',
      fechaIngreso: '2026-09-01', sueldoActual: '4500.00', puesto: null, jefeDirecto: null, usuario: null,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Sin usuario asociado');
    expect(fixture.nativeElement.textContent).toContain('Sin jefe directo');
    expect(fixture.nativeElement.textContent).not.toContain('Editar empleado');
  });

  it('shows a 404 instead of an empty detail', () => {
    const fixture = TestBed.createComponent(EmpleadoDetalle);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('http://localhost:3000/empleados/7')
      .flush({ message: 'Empleado no encontrado' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Empleado no encontrado');
    expect(fixture.nativeElement.querySelector('article')).toBeNull();
  });
});
