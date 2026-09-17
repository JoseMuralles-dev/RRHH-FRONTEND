import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { API } from '../../../../core/config/apis';
import { ActualizarUsuario } from './actualizar-usuario';

describe('ActualizarUsuario', () => {
  let fixture: ComponentFixture<ActualizarUsuario>;
  let http: HttpTestingController;
  const userUrl = `${API.baseUrl}${API.usuarios.base}/1`;
  const empleadosUrl = `${API.baseUrl}${API.empleados.base}/select`;
  const rolesUrl = `${API.baseUrl}${API.roles.base}`;
  const usuario = {
    idUsuario: 1, idEmpleado: null, idRol: 1,
    correo: 'admin@intertornillos.com', estado: 'ACTIVO', isActive: true,
    createdAt: '2026-09-14T16:09:57.000Z', updatedAt: '2026-09-14T16:09:57.000Z',
    rol: { idRol: 1, codigoRol: 'ADMIN', nombreRol: 'Administrador', nivelJerarquico: 4 }
  };
  const field = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`[formControlName="${name}"]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarUsuario],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } }],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ActualizarUsuario);
    await fixture.whenStable();
    http.expectOne(empleadosUrl).flush([{ idEmpleado: 9, nombreCompleto: 'Ana Perez' }]);
    await fixture.whenStable();
  });

  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  it.each([true, false])('fills the form automatically, roles arrive first: %s', async (rolesFirst) => {
    expect(fixture.nativeElement.textContent).toContain('Cargando usuario');
    const userRequest = http.expectOne(userUrl);
    expect(userRequest.request.method).toBe('GET');
    const rolesRequest = http.expectOne(rolesUrl);
    if (rolesFirst) {
      rolesRequest.flush([usuario.rol]);
      await fixture.whenStable();
      userRequest.flush(usuario);
    } else {
      userRequest.flush(usuario);
      await fixture.whenStable();
      rolesRequest.flush([usuario.rol]);
    }
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Cargando usuario');
    expect(field('correo').value).toBe(usuario.correo);
    expect(fixture.componentInstance.usuarioForm.controls.idEmpleado.value).toBeNull();
    expect((field('idEmpleado') as unknown as HTMLSelectElement).selectedOptions[0].textContent).toBe('Sin empleado asociado');
    expect(fixture.componentInstance.usuarioForm.getRawValue().isActive).toBe(true);
    expect(field('isActive').disabled).toBe(false);
    const role = field('idRol') as unknown as HTMLSelectElement;
    expect(role.selectedOptions[0].textContent).toBe('Administrador');
    expect(fixture.componentInstance.usuarioForm.getRawValue().idRol).toBe(1);
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(false);
  });

  it('saves the edited user through PATCH and preserves a null employee', async () => {
    http.expectOne(rolesUrl).flush([usuario.rol]);
    http.expectOne(userUrl).flush(usuario);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    field('correo').value = 'nuevo@intertornillos.com';
    field('correo').dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const request = http.expectOne(userUrl);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      idEmpleado: null, idRol: 1, correo: 'nuevo@intertornillos.com', isActive: true
    });
    expect(request.request.body).not.toHaveProperty('estado');
    expect(request.request.body).not.toHaveProperty('password');
    expect(request.request.body).not.toHaveProperty('passwordHash');
    request.flush(usuario);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/usuarios']);
  });

  it.each([true, false])('sends all editable fields with boolean isActive=%s and no password', async (isActive) => {
    http.expectOne(rolesUrl).flush([usuario.rol]);
    http.expectOne(userUrl).flush({ ...usuario, isActive: !isActive, estado: !isActive ? 'ACTIVO' : 'INACTIVO' });
    await fixture.whenStable();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const select = field('isActive') as unknown as HTMLSelectElement;
    select.selectedIndex = isActive ? 0 : 1;
    select.dispatchEvent(new Event('change'));
    const empleadoSelect = field('idEmpleado') as unknown as HTMLSelectElement;
    empleadoSelect.selectedIndex = 1;
    empleadoSelect.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.usuarioForm.controls.idEmpleado.value).toBe(9);
    fixture.componentInstance.actualizarUsuario();
    fixture.componentInstance.actualizarUsuario();
    const request = http.expectOne(userUrl);
    expect(request.request.body).toEqual({ correo: usuario.correo, idRol: 1, idEmpleado: 9, isActive });
    request.flush({ ...usuario, isActive });
    await fixture.whenStable();
  });

  it('keeps the assigned employee selected when options arrive after the user', async () => {
    fixture.componentInstance.cargarEmpleados();
    http.expectOne(rolesUrl).flush([usuario.rol]);
    http.expectOne(userUrl).flush({ ...usuario, idEmpleado: 9 });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(true);
    http.expectOne(empleadosUrl).flush([{ idEmpleado: 9, nombreCompleto: 'Ana Perez' }]);
    await fixture.whenStable();
    const select = field('idEmpleado') as unknown as HTMLSelectElement;
    expect(select.selectedOptions[0].textContent).toContain('Ana Perez');
    expect(fixture.componentInstance.usuarioForm.controls.idEmpleado.value).toBe(9);
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(false);
    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.usuarioForm.controls.idEmpleado.value).toBeNull();
  });

  it('preserves an assigned employee absent from the active options', async () => {
    http.expectOne(rolesUrl).flush([usuario.rol]);
    http.expectOne(userUrl).flush({ ...usuario, idEmpleado: 99 });
    await fixture.whenStable();
    const select = field('idEmpleado') as unknown as HTMLSelectElement;
    expect(select.selectedOptions[0].textContent).toContain('Empleado actual (ID: 99)');
    expect(fixture.componentInstance.usuarioForm.controls.idEmpleado.value).toBe(99);
  });
  it('shows a load error instead of a blank form and allows retrying', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    http.expectOne(rolesUrl).flush([usuario.rol]);
    http.expectOne(userUrl).flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el usuario.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    fixture.nativeElement.querySelector('.error-box button').click();
    http.expectOne(userUrl).flush(usuario);
    await fixture.whenStable();
    expect(field('correo').value).toBe(usuario.correo);
    expect(fixture.nativeElement.textContent).not.toContain('No se pudo cargar el usuario.');
  });
});
