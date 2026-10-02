import { Component, Input } from '@angular/core';
import { KpiDashboardResponse } from '../../models/dashboard-kpi.model';
import { KpiBarChart, valorGrafica } from '../kpi-bar-chart';

@Component({
  selector: 'app-grafica-serie-diaria',
  standalone: true,
  imports: [KpiBarChart],
  templateUrl: './grafica-serie-diaria.html',
  styleUrl: './grafica-serie-diaria.css',
})
export class GraficaSerieDiaria {
  @Input() dashboard: KpiDashboardResponse | null = null;

  get series() {
    return (this.dashboard?.seriesDiarias ?? []).map(serie => ({
      id: serie.idMetrica,
      nombre: serie.nombre,
      unidad: serie.unidadMedida,
      rows: [...(serie.puntos ?? [])]
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .map(punto => ({ label: punto.fecha, value: valorGrafica(punto.valor) }))
    }));
  }
}
