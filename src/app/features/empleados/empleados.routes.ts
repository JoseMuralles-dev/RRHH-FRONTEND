import { Routes } from '@angular/router';
import { permisoEmpleado } from './guards/permiso-empleado';

export const EMPLEADOS_ROUTES: Routes = [
  { path: 'sin-acceso', loadComponent: () => import('./pages/empleados-sin-acceso/empleados-sin-acceso').then(m => m.EmpleadosSinAcceso) },
  { path: '', pathMatch: 'full', canActivate: [permisoEmpleado], data: { nivel: 3 },
    loadComponent: () => import('./pages/empleados-list/empleados-list').then(m => m.EmpleadosList) },
  { path: 'nuevo', canActivate: [permisoEmpleado], data: { nivel: 3 },
    loadComponent: () => import('./pages/crear-empleado/crear-empleado').then(m => m.CrearEmpleado) },
  { path: ':id/editar', canActivate: [permisoEmpleado], data: { nivel: 3 },
    loadComponent: () => import('./pages/actualizar-empleado/actualizar-empleado').then(m => m.ActualizarEmpleado) },
  { path: ':id', canActivate: [permisoEmpleado], data: { nivel: 3 },
    loadComponent: () => import('./pages/empleado-detalle/empleado-detalle').then(m => m.EmpleadoDetalle) },
];
