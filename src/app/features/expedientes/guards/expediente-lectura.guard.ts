import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
export const expedienteLecturaGuard: CanActivateFn = route => {
  const usuario = inject(AuthService).getUsuarioSesion();
  const router = inject(Router);
  if (!usuario) return router.createUrlTree(['/login']);
  if ([3, 4].includes(usuario.nivelJerarquico)) return true;
  const id = route.paramMap.get('idEmpleado');
  return [1, 2].includes(usuario.nivelJerarquico) && !!usuario.idEmpleado
    && (id === null || Number(id) === usuario.idEmpleado)
    ? true : router.createUrlTree(['/dashboard']);
};
