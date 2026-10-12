import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { EmpleadosList } from './empleados-list';

import { API } from '../../../../core/config/apis';
const base = API.baseUrl + API.empleados.base;

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
    http.expectOne(base).flush([]);
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
    http.expectOne(base).flush([]);
    expect(component.empleados()).toEqual([]);
  });

  it('hides mutation controls at level 2 and distinguishes connection failure from an empty list', async () => {
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne(base).error(new ProgressEvent('error'));
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
    http.expectOne(base).flush([{ idEmpleado: 1, primerNombre: 'Ana', primerApellido: 'Pérez' }]);
    const component = fixture.componentInstance;
    const employee = component.empleados()[0];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.desactivar(employee);
    http.expectNone(req => req.method === 'PATCH');
    confirm.mockReturnValue(true);
    component.desactivar(employee);
    component.desactivar(employee);
    http.expectOne(base + '/1/desactivar').flush(null);
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne(base).flush([]);
    expect(component.empleados()).toEqual([]);
    expect(component.aviso()).toContain('desactivado');
  });

  it('selecciona desde el directorio y cancela perfiles anteriores', async () => {
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges(); await vi.advanceTimersByTimeAsync(0);
    const ana = { idEmpleado: 1, primerNombre: 'Ana', primerApellido: 'Perez' };
    const luis = { idEmpleado: 2, primerNombre: 'Luis', primerApellido: 'Lopez' };
    http.expectOne(base).flush([ana, luis]); fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.employee-row') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    const anterior = http.expectOne(base + '/1');
    buttons[1].click(); expect(anterior.cancelled).toBe(true);
    http.expectOne(base + '/2').flush({ ...luis, puesto: { nombrePuesto: 'Analista', departamento: { nombreDepartamento: 'Sistemas' } }, fechaIngreso: '2025-01-10', telefono: '12345678' });
    fixture.detectChanges();
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    const panel = fixture.nativeElement.querySelector('#perfil-empleado');
    expect(panel.textContent).toContain('Luis Lopez'); expect(panel.textContent).toContain('Sistemas');
    expect(panel.textContent).toContain('10/01/2025'); expect(panel.textContent).toContain('12345678');
    expect(panel.textContent).not.toContain('Editar perfil'); expect(panel.textContent).not.toContain('Desactivar empleado');
  });

  it('limpia el perfil cuando la búsqueda excluye al empleado', async () => {
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges(); await vi.advanceTimersByTimeAsync(0);
    http.expectOne(base).flush([{ idEmpleado: 1, primerNombre: 'Ana', primerApellido: 'Perez' }]);
    const c = fixture.componentInstance;
    c.seleccionar(c.empleados()[0]); const req = http.expectOne(base + '/1');
    c.busqueda.setValue('Luis'); await vi.advanceTimersByTimeAsync(300);
    http.expectOne(r => r.params.get('texto') === 'Luis').flush([]);
    expect(req.cancelled).toBe(true); expect(c.perfil()).toBeNull(); expect(c.seleccionado()).toBeNull();
  });

  it('permite reintentar una ficha fallida y conserva las acciones de RRHH', async () => {
    vi.spyOn(auth, 'getNivelJerarquico').mockReturnValue(3);
    const fixture = TestBed.createComponent(EmpleadosList);
    fixture.detectChanges(); await vi.advanceTimersByTimeAsync(0);
    const ana = { idEmpleado: 1, primerNombre: 'Ana', primerApellido: 'Perez' };
    http.expectOne(base).flush([ana]);
    const c = fixture.componentInstance; c.seleccionar(c.empleados()[0]);
    http.expectOne(base + '/1').flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges(); expect(c.errorPerfil()).toBeTruthy(); expect(c.cargandoPerfil()).toBe(false);
    c.reintentarPerfil(); http.expectOne(base + '/1').flush(ana); fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('#perfil-empleado');
    expect(panel.textContent).toContain('Editar perfil'); expect(panel.textContent).toContain('Desactivar empleado');
    expect(panel.querySelector('a[href="/expedientes/empleado/1"]')).not.toBeNull();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    c.desactivar(c.perfil()!); http.expectOne(base + '/1/desactivar').flush(null);
    expect(c.perfil()).toBeNull();
    await vi.advanceTimersByTimeAsync(0); http.expectOne(base).flush([]);
  });
});
