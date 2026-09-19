import { equipoKpiGuard } from './guards/equipo-kpi.guard';
import { Routes } from '@angular/router';

import {
  KpiDashboard
} from './pages/kpi-dashboard/kpi-dashboard';

import {
  KpiEquipo
} from './pages/kpi-equipo/kpi-equipo';

export const KPI_ROUTES: Routes = [

  {
    path: '',
    redirectTo: 'mi-desempeno',
    pathMatch: 'full'
  },

  {
    path: 'mi-desempeno',
    component: KpiDashboard
  },

  {
    path: 'equipo',
    canActivate: [equipoKpiGuard],
    component: KpiEquipo
  }

];