import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

export const equipoKpiGuard: CanActivateFn = () => {
  const usuario = inject(AuthService).getUsuarioSesion();
  const router = inject(Router);
  if (!usuario) return router.createUrlTree(['/login']);
  return [3, 4].includes(usuario.nivelJerarquico) || (usuario.nivelJerarquico === 2 && usuario.idEmpleado !== null)
    ? true
    : router.createUrlTree(['/kpis/mi-desempeno']);
};