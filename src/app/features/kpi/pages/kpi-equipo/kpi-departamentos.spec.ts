import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { KpiEquipo } from './kpi-equipo';
import { KpiService } from '../../services/kpi.service';

describe('KPI de todos los departamentos', () => {
  function abrir(alcance = 'TODOS_DEPARTAMENTOS') {
    const empleados = [3, 4].map((idDepartamento, i) => ({
      empleado: { idEmpleado: i + 1, nombre: 'Empleado ' + (i + 1), idDepartamento, departamento: i ? 'Ventas' : 'Bodega' },
      dashboard: { idEmpleado: i + 1, periodo: { anio: 2026, mes: 10 }, evaluaciones: [], seriesDiarias: [], tieneDatos: false, diasConDatos: 0 },
    }));
    TestBed.configureTestingModule({
      imports: [KpiEquipo],
      providers: [provideRouter([]), { provide: KpiService, useValue: { getMiEquipo: () => of({
        idEncargado: null, alcance, periodo: { anio: 2026, mes: 10 },
        totalSubordinados: 2, empleados,
      }) } }],
    });
    const fixture = TestBed.createComponent(KpiEquipo);
    fixture.detectChanges();
    return fixture;
  }
  it('ofrece departamentos sin saturar la pantalla al entrar', () => {
    const f = abrir();
    expect(f.nativeElement.querySelector('h1').textContent).toContain('KPI por departamento');
    expect(f.componentInstance.departamentos.map(d => d.nombre)).toEqual(['Bodega', 'Ventas']);
    expect(f.nativeElement.querySelectorAll('.employee-card').length).toBe(0);
    expect(f.nativeElement.querySelector('app-grafica-equipo')).toBeNull();
  });
  it('el filtro afecta listado y datos de graficas y cierra el detalle anterior', () => {
    const f = abrir();
    f.componentInstance.filtrarDepartamento('3');
    f.componentInstance.seleccionarEmpleado(f.componentInstance.empleadosVisibles[0]);
    const select: HTMLSelectElement = f.nativeElement.querySelector('#departamento-kpi');
    select.value = '4'; select.dispatchEvent(new Event('change'));
    f.detectChanges();
    expect(f.componentInstance.empleadoSeleccionado).toBeNull();
    expect(f.componentInstance.empleadosVisibles.map(e => e.empleado.idDepartamento)).toEqual([4]);
    expect(f.nativeElement.querySelectorAll('.employee-card').length).toBe(1);
    select.value = ''; select.dispatchEvent(new Event('change')); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.employee-card').length).toBe(0);
    expect(f.nativeElement.querySelector('app-grafica-equipo')).toBeNull();
  });

  it('permite al encargado filtrar su equipo por empleado desde el selector', () => {
    const f = abrir('EQUIPO');
    const c = f.componentInstance;
    const select: HTMLSelectElement = f.nativeElement.querySelector('#empleado-kpi');
    expect(select.disabled).toBe(false);
    expect(c.empleadosVisibles.length).toBe(2);
    expect(f.nativeElement.querySelector('app-grafica-equipo')).not.toBeNull();
    select.value = '2'; select.dispatchEvent(new Event('change')); f.detectChanges();
    expect(c.empleadosVisibles.map(e => e.empleado.idEmpleado)).toEqual([2]);
    expect(f.nativeElement.querySelector('app-grafica-equipo')).toBeNull();
    expect(f.nativeElement.querySelector('app-grafica-kpi')).toBeNull();
    expect(f.nativeElement.querySelectorAll('.employee-card').length).toBe(1);
    select.value = ''; select.dispatchEvent(new Event('change')); f.detectChanges();
    expect(f.nativeElement.querySelector('app-grafica-equipo')).not.toBeNull();
    expect(f.nativeElement.querySelector('app-grafica-kpi')).not.toBeNull();
    expect(c.empleadosVisibles.length).toBe(2);
  });
  it('limita opciones al departamento y limpia el empleado al cambiarlo', () => {
    const f = abrir();
    const c = f.componentInstance;
    expect(f.nativeElement.querySelector('#empleado-kpi').disabled).toBe(true);
    c.filtrarDepartamento('3'); c.filtrarEmpleado('1');
    expect(c.empleadoFiltro).toBe('1');
    expect(c.opcionesEmpleado.map(e => e.empleado.idEmpleado)).toEqual([1]);
    c.seleccionarEmpleado(c.empleadosVisibles[0]);
    c.filtrarDepartamento('4');
    expect(c.empleadoFiltro).toBe('');
    expect(c.empleadoSeleccionado).toBeNull();
    expect(c.empleadosVisibles.map(e => e.empleado.idEmpleado)).toEqual([2]);
    c.filtrarEmpleado('1');
    expect(c.empleadoFiltro).toBe('');
  });
  it('descarta un empleado que ya no aparece al recargar el periodo', () => {
    const f = abrir('EQUIPO');
    const c = f.componentInstance;
    c.filtrarEmpleado('2');
    const service = TestBed.inject(KpiService);
    vi.spyOn(service, 'getMiEquipo').mockReturnValue(of({ ...c.equipo!, empleados: [c.equipo!.empleados[0]] }));
    c.cargarEquipo();
    expect(c.empleadoFiltro).toBe('');
    expect(c.empleadosVisibles.map(e => e.empleado.idEmpleado)).toEqual([1]);
  });
});
