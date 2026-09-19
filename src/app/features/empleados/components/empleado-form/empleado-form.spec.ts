import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { EmpleadoForm } from './empleado-form';
import { Empleado } from '../../models/empleado.model';

const empleado: Empleado = {
  idEmpleado: 7, idPuesto: 1, idJefeDirecto: 2, codigoSapEmpleado: 1001,
  primerNombre: 'Ana', primerApellido: 'Pérez', dpi: '0012345678901', igss: '00123',
  fechaNacimiento: '1995-05-20', fechaIngreso: '2026-09-01', sueldoActual: '4500.00',
  telefono: '55551234', puesto: { nombrePuesto: 'Analista' }, isActive: true,
};

describe('EmpleadoForm', () => {
  let http: HttpTestingController;
  function setup(id: string | null = null) {
    TestBed.configureTestingModule({ imports: [EmpleadoForm], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthService, useValue: { getNivelJerarquico: () => 3 } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
    ] });
    http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EmpleadoForm);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/empleados/select').flush([
      { idEmpleado: 7, nombreCompleto: 'Ana Pérez' }, { idEmpleado: 2, nombreCompleto: 'Luis López' },
    ]);
    http.expectOne('http://localhost:3000/puestos').flush([{ idPuesto: 1, nombrePuesto: 'Analista', isActive: true, departamento: { nombreDepartamento: 'Recursos Humanos', isActive: true } }]);
    if (id) http.expectOne(`http://localhost:3000/empleados/${id}`).flush(empleado);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, navigate };
  }
  afterEach(() => http.verify());

  it('posts only allowed fields, preserving text values and blocking duplicate submissions', () => {
    const { component, navigate } = setup();
    component.form.patchValue({ ...empleado, segundoNombre: '', segundoApellido: '', telefono: '55551234', direccion: '' });
    component.guardar();
    component.guardar();
    const req = http.expectOne('http://localhost:3000/empleados');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.dpi).toBe('0012345678901');
    expect(req.request.body.igss).toBe('00123');
    expect(req.request.body.fechaNacimiento).toBe('1995-05-20');
    expect(req.request.body.sueldoActual).toBe('4500.00');
    expect(req.request.body.idPuesto).toBe(1);
    expect(req.request.body.idEmpleado).toBeUndefined();
    expect(req.request.body.puesto).toBeUndefined();
    expect(req.request.body.isActive).toBeUndefined();
    req.flush(empleado);
    expect(navigate).toHaveBeenCalledWith(['/empleados']);
  });

  it('preloads data, excludes self and sends only changed fields including null removals', () => {
    const { component, fixture } = setup('7');
    expect(component.form.controls.dpi.value).toBe(empleado.dpi);
    expect(fixture.nativeElement.querySelector('#idPuesto').selectedOptions[0].textContent).toContain('Analista — Recursos Humanos');
    expect(component.jefes().map(j => j.idEmpleado)).toEqual([2]);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#idJefeDirecto');
    expect(select.selectedOptions[0].textContent).toContain('Luis López');
    component.guardar();
    http.expectNone(req => req.method === 'PATCH');
    expect(component.error()).toContain('No hay cambios');
    component.form.patchValue({ telefono: '55559876', idJefeDirecto: null, codigoSapEmpleado: null });
    component.guardar();
    const req = http.expectOne('http://localhost:3000/empleados/7');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ telefono: '55559876', idJefeDirecto: null, codigoSapEmpleado: null });
    req.flush(empleado);
  });

  it('rejects invalid values and self-management before submitting', () => {
    const { component } = setup('7');
    component.form.patchValue({ idPuesto: 1.5, idJefeDirecto: 7, primerNombre: '   ', dpi: '12345678901234' });
    component.guardar();
    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.idJefeDirecto.hasError('propioJefe')).toBe(true);
    expect(component.error()).toContain('Revisa');
    http.expectNone(req => req.method === 'PATCH');
  });

  it('shows backend conflicts and enables retry after saving fails', () => {
    const { component } = setup();
    component.form.patchValue({ ...empleado, segundoNombre: '', segundoApellido: '', telefono: '55551234', direccion: '' });
    component.guardar();
    http.expectOne('http://localhost:3000/empleados').flush({ message: ['DPI duplicado', 'IGSS duplicado'] },
      { status: 409, statusText: 'Conflict' });
    expect(component.error()).toBe('DPI duplicado\nIGSS duplicado');
    expect(component.saving()).toBe(false);
  });
});
