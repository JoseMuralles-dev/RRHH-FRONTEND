import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { API } from '../../../../core/config/apis';
import { CrearUsuario } from './crear-usuario';

describe('CrearUsuario employee selector', () => {
  let fixture: ComponentFixture<CrearUsuario>;
  let http: HttpTestingController;
  const empleadosUrl = `${API.baseUrl}${API.empleados.base}/select`;
  const empleados = [{ idEmpleado: 9, nombreCompleto: 'Ana Perez' }, { idEmpleado: 12, nombreCompleto: 'Luis Lopez' }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearUsuario],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CrearUsuario);
    await fixture.whenStable();
    http.expectOne(`${API.baseUrl}${API.roles.base}`).flush([{ idRol: 1, nombreRol: 'Administrador' }]);
  });

  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  it('renders employee names and submits the chosen numeric ID', async () => {
    expect(fixture.nativeElement.textContent).toContain('Cargando empleados');
    http.expectOne(empleadosUrl).flush(empleados);
    await fixture.whenStable();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('[formControlName="idEmpleado"]');
    expect(select.options.length).toBe(3);
    expect(select.options[1].textContent).toContain('Ana Perez');
    expect(select.options[2].textContent).toContain('Luis Lopez');
    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.usuarioForm.controls.idEmpleado.value).toBe(12);
    fixture.componentInstance.usuarioForm.patchValue({ correo: 'luis@example.com', idRol: 1, password: 'Password123', confirmarPassword: 'Password123' });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const request = http.expectOne(`${API.baseUrl}${API.usuarios.base}`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.idEmpleado).toBe(12);
    request.flush({ idUsuario: 7 });
    await fixture.whenStable();
  });

  it('shows an employee loading error, blocks saving and allows retrying', async () => {
    http.expectOne(empleadosUrl).flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los empleados.');
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(true);
    fixture.componentInstance.crearUsuario();
    http.expectNone(request => request.method === 'POST');
    fixture.nativeElement.querySelector('.error-box button').click();
    http.expectOne(empleadosUrl).flush(empleados);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Ana Perez');
    expect(fixture.nativeElement.textContent).not.toContain('No se pudieron cargar los empleados.');
  });

  it('shows an empty list message and requires choosing an employee', async () => {
    http.expectOne(empleadosUrl).flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No hay empleados activos disponibles.');
    fixture.componentInstance.crearUsuario();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Selecciona un empleado.');
    http.expectNone(request => request.method === 'POST');
  });
});
