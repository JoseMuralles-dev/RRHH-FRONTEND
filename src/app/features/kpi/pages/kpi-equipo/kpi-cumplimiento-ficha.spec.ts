import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KpiEquipo } from './kpi-equipo';
import { KpiService } from '../../services/kpi.service';
import { KpiEmpleadoEquipo, KpiResultado } from '../../models/dashboard-kpi.model';
function empleado(porcentajes: (number | null)[]): KpiEmpleadoEquipo {
  const resultados: KpiResultado[] = porcentajes.map((porcentajeCumplimiento, i) => ({ idResultado: i + 1, idMetrica: i + 1, codigo: 'METRICA_' + i, nombre: 'Métrica ' + i, unidadMedida: 'unidades', valorObtenido: 10, metaAplicada: 20, porcentajeCumplimiento, puntosObtenidos: 5, observacion: null, detalles: [] }));
  return { empleado: { idEmpleado: 10, nombre: 'Colaborador de prueba' }, dashboard: { idEmpleado: 10, periodo: { anio: 2026, mes: 10, fechaInicial: '2026-10-01', fechaFinal: '2026-10-31' }, tieneDatos: true, ultimaCargaDiaria: null, diasConDatos: 2, seriesDiarias: [], evaluaciones: [{ idEvaluacion: 1, idDepartamento: 1, estado: 'CALCULADA', puntajeBase: 41.25, penalizacionTotal: 0, notaFinal: 41.25, metaGlobal: 100, calculadaEn: null, resultados }] } };
}
function abrir(item: KpiEmpleadoEquipo) {
  TestBed.configureTestingModule({ imports: [KpiEquipo], providers: [{ provide: KpiService, useValue: { getMiEquipo: () => of({ idEncargado: 1, periodo: { anio: 2026, mes: 10 }, totalSubordinados: 1, empleados: [item] }) } }] });
  const fixture = TestBed.createComponent(KpiEquipo); fixture.detectChanges(); return fixture;
}
describe('Semicírculo de cumplimiento del colaborador', () => {
  it('muestra el promedio de metas, separado de la nota por puntos', () => {
    const item = empleado([50, 100]); const f = abrir(item);
    expect(f.componentInstance.cumplimientoDe(item)).toEqual({ porcentaje: 75, validas: 2, total: 2 });
    const card: HTMLElement = f.nativeElement.querySelector('.employee-card');
    expect(card.querySelector('svg text')?.textContent).toContain('75%');
    expect(card.querySelector('.employee-score')?.textContent).toContain('41.25');
  });
  it('incluye ceros válidos y advierte si falta un porcentaje', () => {
    const item = empleado([0, 100, null]); const f = abrir(item);
    expect(f.componentInstance.cumplimientoDe(item)).toEqual({ porcentaje: 50, validas: 2, total: 3 });
    expect(f.nativeElement.querySelector('.employee-compliance').textContent).toContain('Datos parciales');
  });
  it('no inventa cero si no hay datos calculables', () => {
    const item = empleado([null]); const f = abrir(item);
    expect(f.componentInstance.cumplimientoDe(item).porcentaje).toBeNull();
    expect(f.nativeElement.querySelector('.employee-compliance text').textContent).toBe('—');
    expect(f.nativeElement.querySelector('.compliance-fill')).toBeNull();
  });
  it('conserva porcentajes mayores a cien y limita solo el arco', () => {
    const f = abrir(empleado([120]));
    expect(f.nativeElement.querySelector('.employee-compliance text').textContent).toContain('120%');
    expect(f.nativeElement.querySelector('.compliance-fill').getAttribute('stroke-dasharray')).toBe('100 100');
  });
  it('no duplica métricas repetidas entre evaluaciones', () => {
    const item = empleado([75]); item.dashboard.evaluaciones.push(item.dashboard.evaluaciones[0]);
    const f = abrir(item);
    expect(f.componentInstance.cumplimientoDe(item)).toEqual({ porcentaje: 75, validas: 1, total: 1 });
  });
});
