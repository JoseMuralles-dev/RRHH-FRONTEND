import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

export const permisoEmpleado: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  return auth.getNivelJerarquico() >= (route.data['nivel'] ?? 2)
    || router.createUrlTree(['/empleados/sin-acceso']);
};
