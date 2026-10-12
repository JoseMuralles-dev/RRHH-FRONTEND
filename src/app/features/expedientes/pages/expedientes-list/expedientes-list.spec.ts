import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { ExpedientesList } from './expedientes-list';
import { expediente } from '../../testing/fixtures';
describe('ExpedientesList', () => {
  let http: HttpTestingController;
  function abrir(nivel = 3) { TestBed.configureTestingModule({ imports: [ExpedientesList], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: { getNivelJerarquico: () => nivel, logout: vi.fn() } }] }); http = TestBed.inject(HttpTestingController); return TestBed.createComponent(ExpedientesList); }
  afterEach(() => http.verify());
  it('reutiliza empleados y distingue ausencia de error de permisos', async () => {
    const f = abrir(); http.expectOne('http://localhost:3000/empleados/select').flush([{ idEmpleado: 10, nombreCompleto: 'Ana' }, { idEmpleado: 20, nombreCompleto: 'José' }, { idEmpleado: 30, nombreCompleto: 'Luis' }]);
    http.expectOne('http://localhost:3000/expedientes/empleado/10').flush(expediente);
    http.expectOne('http://localhost:3000/expedientes/empleado/20').flush({}, { status: 404, statusText: 'Not found' });
    http.expectOne('http://localhost:3000/expedientes/empleado/30').flush({}, { status: 403, statusText: 'Forbidden' });
    await f.whenStable(); expect(f.componentInstance.estados()).toEqual({ 10: 'Con expediente', 20: 'Sin expediente activo', 30: 'No se pudo verificar' });
    expect(f.nativeElement.textContent).toContain('Ver expediente');
  });
  it('no consulta empleados para un usuario sin permiso', () => { const f = abrir(1); http.expectNone(() => true); expect(f.componentInstance.error()).toContain('RRHH'); });
  it('cancela estados de la búsqueda anterior', () => {
    const f = abrir(); http.expectOne('http://localhost:3000/empleados/select').flush([{ idEmpleado: 10, nombreCompleto: 'Ana' }]);
    const req = http.expectOne('http://localhost:3000/expedientes/empleado/10'); f.componentInstance.busqueda.setValue('Sin coincidencias'); f.componentInstance.buscar(); expect(req.cancelled).toBe(true); expect(f.componentInstance.visibles()).toHaveLength(0);
  });
});
