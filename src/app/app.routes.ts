import { Routes } from '@angular/router';

import { LoginComponent }
  from './features/auth/pages/login/login';

import { Dashboard }
  from './features/dashboard/pages/dashboard/dashboard';

import { authGuard }
  from './core/guards/auth-guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'dashboard',

    component: Dashboard,

    canActivate: [
      authGuard
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];
