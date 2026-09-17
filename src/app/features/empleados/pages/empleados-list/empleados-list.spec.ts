import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { EmpleadosList } from './empleados-list';

describe('EmpleadosList', () => {
  let http: HttpTestingController;
  const auth = { getNivelJerarquico: () => 2 };
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [EmpleadosList], providers: [provideHttpClient(),
      provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: auth }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('debounces, cancels stale requests and reloads all employees when cleared', async () => {
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('http://localhost:3000/empleados').flush([]);
    const component = fixture.componentInstance;
    component.busqueda.setValue('Juan');
    await vi.advanceTimersByTimeAsync(299);
    http.expectNone(req => req.url.endsWith('/buscar'));
    await vi.advanceTimersByTimeAsync(1);
    const old = http.expectOne(req => req.params.get('texto') === 'Juan');
    component.busqueda.setValue('Ana');
    expect(old.cancelled).toBe(true);
    await vi.advanceTimersByTimeAsync(300);
    http.expectOne(req => req.params.get('texto') === 'Ana').flush([{ idEmpleado: 2, primerNombre: 'Ana', primerApellido: 'Pérez' }]);
    expect(component.empleados()[0].primerNombre).toBe('Ana');
    component.busqueda.setValue('   ');
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('http://localhost:3000/empleados').flush([]);
    expect(component.empleados()).toEqual([]);
  });

  it('hides mutation controls at level 2 and distinguishes connection failure from an empty list', async () => {
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('http://localhost:3000/empleados').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo conectar');
    expect(fixture.nativeElement.textContent).not.toContain('No hay empleados activos');
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo empleado');
  });

  it('confirms deactivation, prevents duplicates and refreshes after success', async () => {
    vi.spyOn(auth, 'getNivelJerarquico').mockReturnValue(3);
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('http://localhost:3000/empleados').flush([{ idEmpleado: 1, primerNombre: 'Ana', primerApellido: 'Pérez' }]);
    const component = fixture.componentInstance;
    const employee = component.empleados()[0];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.desactivar(employee);
    http.expectNone(req => req.method === 'PATCH');
    confirm.mockReturnValue(true);
    component.desactivar(employee);
    component.desactivar(employee);
    http.expectOne('http://localhost:3000/empleados/1/desactivar').flush(null);
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('http://localhost:3000/empleados').flush([]);
    expect(component.empleados()).toEqual([]);
    expect(component.aviso()).toContain('desactivado');
  });
});
