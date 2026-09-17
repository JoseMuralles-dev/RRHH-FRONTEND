import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { EmpleadoService, mensajeError } from './empleado.service';

describe('EmpleadoService', () => {
  let service: EmpleadoService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(EmpleadoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses list, detail, selector and encoded search endpoints', () => {
    service.listar().subscribe();
    http.expectOne('http://localhost:3000/empleados').flush([]);
    service.obtener(7).subscribe();
    http.expectOne('http://localhost:3000/empleados/7').flush({ idEmpleado: 7 });
    service.select().subscribe();
    http.expectOne('http://localhost:3000/empleados/select').flush([]);
    service.buscar('  Pérez López  ').subscribe();
    const search = http.expectOne(req => req.url.endsWith('/buscar'));
    expect(search.request.params.get('texto')).toBe('Pérez López');
    search.flush([]);
  });

  it('deactivates without a body', () => {
    service.desactivar(7).subscribe();
    const req = http.expectOne('http://localhost:3000/empleados/7/desactivar');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush(null);
  });

  it('ends the session and returns to login on 401', () => {
    const logout = vi.spyOn(TestBed.inject(AuthService), 'logout');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.listar().subscribe({ error: () => {} });
    http.expectOne('http://localhost:3000/empleados').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('preserves Nest validation arrays and distinguishes network and permission errors', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 400, error: { message: ['DPI inválido', 'IGSS requerido'] } })))
      .toBe('DPI inválido\nIGSS requerido');
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toContain('conectar');
    expect(mensajeError(new HttpErrorResponse({ status: 403 }))).toContain('permisos');
    expect(mensajeError(new HttpErrorResponse({ status: 409 }))).toContain('conflicto');
    expect(mensajeError(new HttpErrorResponse({ status: 404 }))).toContain('No se encontró');
  });
});
