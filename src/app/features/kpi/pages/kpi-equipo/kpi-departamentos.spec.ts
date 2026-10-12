import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { KpiEquipo } from './kpi-equipo';
import { KpiService } from '../../services/kpi.service';

describe('KPI de todos los departamentos', () => {
  function abrir() {
    const empleados = [3, 4].map((idDepartamento, i) => ({
      empleado: { idEmpleado: i + 1, nombre: 'Empleado ' + (i + 1), idDepartamento, departamento: i ? 'Ventas' : 'Bodega' },
      dashboard: { idEmpleado: i + 1, periodo: { anio: 2026, mes: 10 }, evaluaciones: [], seriesDiarias: [], tieneDatos: false, diasConDatos: 0 },
    }));
    TestBed.configureTestingModule({
      imports: [KpiEquipo],
      providers: [provideRouter([]), { provide: KpiService, useValue: { getMiEquipo: () => of({
        idEncargado: null, alcance: 'TODOS_DEPARTAMENTOS', periodo: { anio: 2026, mes: 10 },
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
});
