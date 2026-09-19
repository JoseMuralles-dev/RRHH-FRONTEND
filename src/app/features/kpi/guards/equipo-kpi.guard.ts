import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

export const equipoKpiGuard: CanActivateFn = () => {
  const usuario = inject(AuthService).getUsuarioSesion();
  const router = inject(Router);
  if (!usuario) return router.createUrlTree(['/login']);
  return usuario.idEmpleado !== null && [2, 3, 4].includes(usuario.nivelJerarquico)
    ? true
    : router.createUrlTree(['/kpis/mi-desempeno']);
};