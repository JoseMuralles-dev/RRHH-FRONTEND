import { administradorGuard } from '../../core/guards/administrador-guard';
import {Routes} from '@angular/router';
import {UsuariosList} from './pages/usuarios-list/usuarios-list';
import {CrearUsuario} from './pages/crear-usuario/crear-usuario';
import {ActualizarUsuario} from './pages/actualizar-usuario/actualizar-usuario';
import {CambiarPassword} from './pages/cambiar-password/cambiar-password';

export const USUARIOS_ROUTES:
  Routes = [
  { path: '', canActivate: [administradorGuard], canActivateChild: [administradorGuard], children: [

  {
    path: '',
    component:
      UsuariosList
  },

  {
    path: 'nuevo',
    component:
      CrearUsuario
  },

  {
    path: ':id/editar',
    component:
      ActualizarUsuario
  },

  {
    path:
      ':id/cambiar-password',

    component:
      CambiarPassword
  }

] }
];