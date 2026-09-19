import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from '../../core/services/auth';
export const accesoDepartamentos: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  return auth.getNivelJerarquico() >= 3 || router.createUrlTree(['/dashboard']);
};
export const DEPARTAMENTOS_ROUTES: Routes = [{
  path: '', canActivate: [accesoDepartamentos],
  loadComponent: () => import('./pages/departamentos/departamentos').then(m => m.Departamentos),
}];
