import { TestBed } from '@angular/core/testing';
import { GraficaKpi } from '../grafica-kpi/grafica-kpi';
import { FichaDesempeno } from './ficha-desempeno';
import { KpiDashboardResponse } from '../../models/dashboard-kpi.model';
describe('Ficha personal de desempeño', () => {
  function abrir(valores: (number | null)[], provisional = false) {
    const dashboard = {
      idEmpleado: 60, empleado: { nombre: 'Oscar Daniel', departamento: 'Bodega' }, diasConDatos: 21,
      evaluaciones: [{ tiempoProvisional: provisional, notaFinal: 65.10, puntajeBase: 65.10, estado: 'CALCULADA',
        resultados: valores.map((v, i) => ({ idMetrica: i, porcentajeCumplimiento: v })) }],
    } as KpiDashboardResponse;
    const f = TestBed.createComponent(FichaDesempeno); f.componentRef.setInput('dashboard', dashboard); f.detectChanges(); return f;
  }
  it('muestra porcentaje final ponderado, nombre y datos parciales', () => {
    const f = abrir([92.88, null]);
    expect(f.nativeElement.querySelector('svg text').textContent).toContain('65.1%');
    expect(f.nativeElement.textContent).toContain('Datos parciales');
    expect(f.nativeElement.textContent).toContain('65.10');
    expect(f.nativeElement.textContent).toContain('Oscar Daniel');
    expect(f.nativeElement.textContent).toContain('21 días');
  });
  it('no convierte datos ausentes en cero', () => {
    const f = abrir([null]);
    expect(f.nativeElement.querySelector('svg text').textContent).toBe('—');
    expect(f.nativeElement.querySelector('.avance')).toBeNull();
  });
  it('usa la nota ponderada en lugar del promedio simple', () => {
    const f = abrir([0, 240]);
    expect(f.nativeElement.querySelector('svg text').textContent).toContain('65.1%');
    expect(f.nativeElement.querySelector('.avance').getAttribute('stroke-dasharray')).toBe('65.1 100');
  });
  it('emite ver detalle sin usar un enlace que cambie la ruta', () => {
    const f = abrir([80]);
    const listener = vi.fn();
    f.componentInstance.verDetalle.subscribe(listener);
    f.nativeElement.querySelector('button').click();
    expect(listener).toHaveBeenCalledOnce();
    expect(f.nativeElement.querySelector('a[href]')).toBeNull();
  });

  it('mantiene la ficha sin el aviso de tiempo provisional', () => {
    const f = abrir([75, null], true);
    expect(f.nativeElement.textContent).not.toContain('25% provisional de Tiempo');
    expect(f.nativeElement.querySelector('svg text').textContent).toContain('65.1%');
  });
  it('omite asignaciones provisionales en graficas de cumplimiento medido', () => {
    const grafica = new GraficaKpi();
    grafica.empleados = [{ empleado: { idEmpleado: 1, nombre: 'Ana' }, dashboard: { evaluaciones: [{
      resultados: [
        { idMetrica: 1, nombre: 'Lineas', porcentajeCumplimiento: 75 },
        { idMetrica: -1, nombre: 'Tiempo', porcentajeCumplimiento: null, asignacionProvisional: true }
      ]
    }] } }] as any;
    expect(grafica.indicadores.map(i => i.nombre)).toEqual(['Lineas']);
  });
});