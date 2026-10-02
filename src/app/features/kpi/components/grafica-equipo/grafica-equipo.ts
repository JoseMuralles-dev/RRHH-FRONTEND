import { Component, Input } from '@angular/core';
import { KpiEmpleadoEquipo } from '../../models/dashboard-kpi.model';
import { KpiBarChart, KpiBarRow, valorGrafica } from '../kpi-bar-chart';

@Component({
  selector: 'app-grafica-equipo',
  standalone: true,
  imports: [KpiBarChart],
  templateUrl: './grafica-equipo.html',
  styleUrl: './grafica-equipo.css'
})
export class GraficaEquipo {
  @Input() empleados: KpiEmpleadoEquipo[] = [];

  get rows(): KpiBarRow[] {
    return this.empleados.map(item => ({
      label: item.empleado.nombre,
      value: valorGrafica(item.dashboard.evaluaciones?.[0]?.notaFinal)
    }));
  }
}
