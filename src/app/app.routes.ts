import { authGuard } from './core/guards/auth-guard';
import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';

import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { CrearUsuario } from './features/usuarios/pages/crear-usuario/crear-usuario';
import { CambiarPassword } from './features/usuarios/pages/cambiar-password/cambiar-password';

export const routes: Routes = [

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: '',
    component: MainLayoutComponent,

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'empleados',
        loadChildren: () => import('./features/empleados/empleados.routes')
          .then(m => m.EMPLEADOS_ROUTES)
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes')
            .then(m => m.USUARIOS_ROUTES)
      },
      {
        path: 'solicitudes',
        loadChildren: () => import('./features/solicitudes/solicitudes.routes')
          .then(m => m.SOLICITUDES_ROUTES)
      },
      {
        path: 'kpis',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/kpi/kpi.routes')
            .then(m => m.KPI_ROUTES)
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];
