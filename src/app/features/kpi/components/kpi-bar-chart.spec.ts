import { TestBed } from '@angular/core/testing';
import { KpiBarChart, valorGrafica } from './kpi-bar-chart';

 describe('KpiBarChart', () => {
  it('interrumpe la línea cuando falta un dato y excluye ausentes del promedio', () => {
    const chart = new KpiBarChart();
    chart.rows = [{ label: '01', value: 0 }, { label: '02', value: null }, { label: '03', value: 150 }];
    chart.referencia = 100;
    expect(chart.path.match(/M/g)?.length).toBe(2);
    expect(chart.path).not.toContain('L');
    expect(chart.promedio).toBe(75);
    expect(chart.avance).toBe(75);
    chart.rows = [{ label: '01', value: 150 }];
    expect(chart.avance).toBe(100);
    expect(chart.promedio).toBe(150);
  });
  it('distingue cero de datos ausentes y conserva porcentajes superiores a 100', async () => {
    const fixture = TestBed.createComponent(KpiBarChart);
    fixture.componentRef.setInput('referencia', 100);
    fixture.componentRef.setInput('rows', [
      { label: 'Cero', value: 0 },
      { label: 'Sin evaluación', value: null },
      { label: 'Supera meta', value: 150 }
    ]);
    await fixture.whenStable();
    const labels = [...fixture.nativeElement.querySelectorAll('.label')].map((el: any) => el.textContent);
    expect(labels[0]).toContain('0');
    expect(labels[0]).not.toContain('Sin datos');
    expect(labels[1]).toContain('Sin datos');
    expect(labels[2]).toContain('150');
    expect(fixture.componentInstance.maximo).toBe(150);
    expect(fixture.nativeElement.querySelectorAll('.bar').length).toBe(2);
  });

  it('representa negativos a la izquierda del cero con una escala finita', () => {
    const chart = new KpiBarChart();
    chart.rows = [{ label: 'A', value: -50 }, { label: 'B', value: 150 }];
    expect(chart.posicion(0)).toBe(25);
    expect(chart.posicion(-50)).toBe(0);
    expect(chart.ancho(-50)).toBe(25);
    chart.rows = [{ label: 'Cero', value: 0 }];
    expect(chart.ancho(0)).toBe(0);
  });

  it('muestra un estado vacío y rechaza valores no numéricos', async () => {
    const fixture = TestBed.createComponent(KpiBarChart);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No hay datos');
    expect(valorGrafica(null)).toBeNull();
    expect(valorGrafica(NaN)).toBeNull();
    expect(valorGrafica(Infinity)).toBeNull();
    expect(valorGrafica(0)).toBe(0);
  });
});
