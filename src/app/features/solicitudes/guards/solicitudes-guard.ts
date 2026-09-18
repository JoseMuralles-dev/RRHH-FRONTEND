import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

export const solicitudesGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !!auth.getUsuarioSesion() || inject(Router).createUrlTree(['/login']);
};
