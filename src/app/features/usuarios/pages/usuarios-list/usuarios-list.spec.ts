import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API } from '../../../../core/config/apis';
import { UsuariosList } from './usuarios-list';

describe('UsuariosList', () => {
  let fixture: ComponentFixture<UsuariosList>;
  let http: HttpTestingController;
  const url = `${API.baseUrl}${API.usuarios.base}`;
  const usuario = {
    idUsuario: 1, idRol: 2, correo: 'ana@example.com',
    estado: 'ACTIVO', isActive: true,
    empleado: { idEmpleado: 1, primerNombre: 'Ana', primerApellido: 'Perez' },
    rol: { idRol: 2, nombreRol: 'Administrador' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsuariosList);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('renders the asynchronous response without manually triggering change detection', async () => {
    expect(fixture.nativeElement.textContent).toContain('Cargando usuarios');
    http.expectOne(url).flush([usuario]);
    await fixture.whenStable();
    const content = fixture.nativeElement.textContent;
    expect(content).not.toContain('Cargando usuarios');
    expect(content).toContain('ana@example.com');
    expect(content).toContain('Ana');
    expect(content).toContain('Administrador');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('renders an error and clears it when a retry succeeds', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    http.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Cargando usuarios');
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los usuarios.');

    fixture.componentInstance.cargarUsuarios();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Cargando usuarios');
    http.expectOne(url).flush([usuario]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('ana@example.com');
    expect(fixture.nativeElement.textContent).not.toContain('No se pudieron cargar los usuarios.');
  });

  it('deactivates through the backend route and refreshes the visible list', async () => {
    http.expectOne(url).flush([usuario]);
    await fixture.whenStable();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.nativeElement.querySelector('.btn-delete').click();
    expect(confirm).toHaveBeenCalledWith(`¿Desea desactivar al usuario ${usuario.correo}?`);
    const request = http.expectOne(`${url}/1/desactivar`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush({ message: 'Usuario con ID 1 desactivado correctamente' });
    http.expectOne(url).flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain(usuario.correo);
    expect(fixture.nativeElement.textContent).not.toContain('Cargando usuarios');
  });

  it('does not deactivate when confirmation is cancelled', async () => {
    http.expectOne(url).flush([usuario]);
    await fixture.whenStable();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.nativeElement.querySelector('.btn-delete').click();
    http.expectNone(request => request.method === 'PATCH');
    expect(fixture.nativeElement.textContent).toContain(usuario.correo);
  });

  it('keeps the user visible and reports a failed deactivation', async () => {
    http.expectOne(url).flush([usuario]);
    await fixture.whenStable();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    fixture.nativeElement.querySelector('.btn-delete').click();
    http.expectOne(`${url}/1/desactivar`).flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(alert).toHaveBeenCalledWith('No se pudo desactivar el usuario.');
    expect(fixture.nativeElement.textContent).toContain(usuario.correo);
    http.expectNone(url);
  });

  it('finishes loading when the response is empty', async () => {
    http.expectOne(url).flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Cargando usuarios');
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(0);
  });
});
