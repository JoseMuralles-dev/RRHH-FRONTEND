import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface KpiBarRow { label: string; value: number | null; }

@Component({
  selector: 'app-kpi-bar-chart',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './kpi-bar-chart.html',
  styleUrl: './kpi-bar-chart.css'
})
export class KpiBarChart {
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() unidad = '';
  @Input() rows: KpiBarRow[] = [];
  @Input() referencia = 0;
  @Input() tipo: 'barras' | 'linea' = 'barras';

  get minimo(): number { return this.rows.reduce((min, row) => Math.min(min, row.value ?? 0), 0); }
  get maximo(): number { return this.rows.reduce((max, row) => Math.max(max, row.value ?? 0), Math.max(1, this.referencia)); }
  posicion(value: number): number { return (value - this.minimo) / (this.maximo - this.minimo) * 100; }
  ancho(value: number): number { return Math.abs(value) / (this.maximo - this.minimo) * 100; }
  get validos(): number[] { return this.rows.flatMap(row => row.value === null ? [] : [row.value]); }
  get promedio(): number | null { const values = this.validos; return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; }
  get avance(): number { return Math.min(100, Math.max(0, (this.promedio ?? 0) / this.referencia * 100)); }
  get ticks(): number[] { return Array.from({ length: 5 }, (_, i) => this.minimo + (this.maximo - this.minimo) * i / 4); }
  get canvasWidth(): number { return Math.max(520, this.rows.length * 64 + 90); }
  x(index: number): number { return 64 + (index + 0.5) * (this.canvasWidth - 90) / Math.max(1, this.rows.length); }
  y(value: number): number { return 220 - this.posicion(value) * 1.8; }
  get barWidth(): number { return Math.min(36, (this.canvasWidth - 90) / Math.max(1, this.rows.length) * 0.6); }
  get path(): string {
    let connected = false;
    return this.rows.map((row, i) => {
      if (row.value === null) { connected = false; return ''; }
      const point = `${connected ? 'L' : 'M'} ${this.x(i)} ${this.y(row.value)}`;
      connected = true;
      return point;
    }).join(' ');
  }
  shortLabel(label: string): string {
    if (this.tipo === 'linea' && /^\d{4}-\d{2}-\d{2}/.test(label)) return label.slice(8, 10) + '/' + label.slice(5, 7);
    return label.length > 12 ? label.slice(0, 11) + '…' : label;
  }
}
export function valorGrafica(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
