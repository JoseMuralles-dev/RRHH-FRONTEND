import { cincoSGuard } from './guards/cinco-s.guard';
import { equipoKpiGuard } from './guards/equipo-kpi.guard';
import { Routes } from '@angular/router';

import {
  KpiDashboard
} from './pages/kpi-dashboard/kpi-dashboard';

import {
  KpiEquipo
} from './pages/kpi-equipo/kpi-equipo';

export const KPI_ROUTES: Routes = [
  { path: 'cinco-s', canActivate: [cincoSGuard], canDeactivate: [(component: { saving(): boolean; form: { dirty: boolean } }) => !component.saving() && (!component.form.dirty || window.confirm('Hay una inspección sin guardar. ¿Salir sin guardar?'))], loadComponent: () => import('./pages/cinco-s/cinco-s').then(m => m.CincoS) },

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