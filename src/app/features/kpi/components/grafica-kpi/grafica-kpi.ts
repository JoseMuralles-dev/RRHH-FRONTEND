import { Component, Input } from '@angular/core';
import { KpiEmpleadoEquipo } from '../../models/dashboard-kpi.model';
import { KpiBarChart, KpiBarRow, valorGrafica } from '../kpi-bar-chart';

@Component({
  selector: 'app-grafica-kpi',
  standalone: true,
  imports: [KpiBarChart],
  templateUrl: './grafica-kpi.html',
  styleUrl: './grafica-kpi.css',
})
export class GraficaKpi {
  @Input() empleados: KpiEmpleadoEquipo[] = [];

  get indicadores(): { id: number; nombre: string; rows: KpiBarRow[] }[] {
    const indicadores = new Map<number, { id: number; nombre: string; rows: KpiBarRow[] }>();
    for (const item of this.empleados) {
      for (const resultado of item.dashboard.evaluaciones?.[0]?.resultados ?? []) {
        let indicador = indicadores.get(resultado.idMetrica);
        if (!indicador) {
          indicador = { id: resultado.idMetrica, nombre: resultado.nombre, rows: [] };
          indicadores.set(resultado.idMetrica, indicador);
        }
        indicador.rows.push({
          label: item.empleado.nombre,
          value: valorGrafica(resultado.porcentajeCumplimiento)
        });
      }
    }
    return [...indicadores.values()];
  }
}
