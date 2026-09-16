import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';

import { MainLayoutComponent } from './layout/main-layout/main-layout';

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
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];