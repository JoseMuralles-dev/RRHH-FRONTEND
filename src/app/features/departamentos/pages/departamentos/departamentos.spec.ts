import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/services/auth';
import { Departamentos } from './departamentos';

describe('CRUD de departamentos', () => {
  let http: HttpTestingController;
  let nivel = 4;
  const registro = { idDepartamento: 3, nombreDepartamento: 'Bodega', descripcion: 'Almacén', isActive: true,
    puestos: [{ idPuesto: 10, nombrePuesto: 'Preparador', isActive: true }] };
  beforeEach(() => {
    nivel = 4;
    TestBed.configureTestingModule({ imports: [Departamentos], providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { getNivelJerarquico: () => nivel } },
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function abrir() {
    const fixture = TestBed.createComponent(Departamentos);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/departamentos').flush([registro]);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }
  it('muestra los nombres de los puestos relacionados', () => {
    const { fixture } = abrir();
    expect(fixture.nativeElement.textContent).toContain('Preparador');
    expect(fixture.nativeElement.textContent).toContain('Bodega');
  });
  it('crea con los campos permitidos y recarga el listado', () => {
    const { component } = abrir();
    component.abrir();
    component.form.setValue({ nombreDepartamento: ' Ventas ', descripcion: ' Comercial ' });
    component.guardar(); component.guardar();
    const req = http.expectOne('http://localhost:3000/departamentos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombreDepartamento: 'Ventas', descripcion: 'Comercial' });
    req.flush({ ...registro, idDepartamento: 4, nombreDepartamento: 'Ventas' });
    http.expectOne('http://localhost:3000/departamentos').flush([]);
    expect(component.formularioAbierto()).toBe(false);
  });
  it('edita el departamento seleccionado', () => {
    const { component } = abrir();
    component.abrir(registro);
    component.form.patchValue({ nombreDepartamento: 'Bodega central' });
    component.guardar();
    const req = http.expectOne('http://localhost:3000/departamentos/3');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...registro, nombreDepartamento: 'Bodega central' });
    http.expectOne('http://localhost:3000/departamentos').flush([]);
  });
  it('muestra el conflicto cuando hay puestos activos al desactivar', () => {
    const { component } = abrir();
    component.pendienteDesactivar.set(registro);
    component.desactivar();
    http.expectOne('http://localhost:3000/departamentos/3/desactivar')
      .flush({ message: 'Tiene puestos activos' }, { status: 409, statusText: 'Conflict' });
    expect(component.error()).toBe('Tiene puestos activos');
    expect(component.saving()).toBe(false);
  });
  it('permite consultar a RRHH pero oculta y bloquea las acciones de escritura', () => {
    nivel = 3;
    const { fixture, component } = abrir();
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo departamento');
    expect(fixture.nativeElement.textContent).not.toContain('Desactivar');
    component.abrir();
    component.guardar();
    expect(component.formularioAbierto()).toBe(false);
    http.expectNone(r => r.method !== 'GET');
  });
});
