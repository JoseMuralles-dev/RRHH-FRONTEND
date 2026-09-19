import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { EmpleadoService } from './services/empleado.service';
import { EMPLEADOS_ROUTES } from './empleados.routes';

describe('Páginas de creación y edición de empleados', () => {
  const obtener = vi.fn(() => of({
    idEmpleado: 7, idPuesto: 1, primerNombre: 'Ana', primerApellido: 'Pérez',
    dpi: '0012345678901', igss: '00123', fechaNacimiento: '1995-05-20',
    fechaIngreso: '2026-09-01', sueldoActual: '4500.00',
  }));

  beforeEach(() => {
    obtener.mockClear();
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'empleados', children: EMPLEADOS_ROUTES }]),
      { provide: AuthService, useValue: { isAuthenticated: () => true, getNivelJerarquico: () => 3 } },
      { provide: EmpleadoService, useValue: { obtener, select: () => of([]), puestos: () => of([]) } },
    ] });
  });

  it('opens the creation page with an empty shared form', async () => {
    const harness = await RouterTestingHarness.create('/empleados/nuevo');
    expect(harness.routeNativeElement?.textContent).toContain('Crear empleado');
    expect(obtener).not.toHaveBeenCalled();
  });

  it('passes the route ID through the edit page to the shared form', async () => {
    const harness = await RouterTestingHarness.create('/empleados/7/editar');
    expect(obtener).toHaveBeenCalledWith(7);
    expect(harness.routeNativeElement?.textContent).toContain('Editar empleado');
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#primerNombre')?.value).toBe('Ana');
  });
});
