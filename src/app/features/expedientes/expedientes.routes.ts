import { expedienteLecturaGuard } from './guards/expediente-lectura.guard';
﻿import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';
import { permisoEmpleado } from '../empleados/guards/permiso-empleado';
export const EXPEDIENTES_ROUTES: Routes = [
  { path: 'mi-expediente', canActivate: [authGuard, expedienteLecturaGuard], loadComponent: () => import('./pages/expediente-detalle/expediente-detalle').then(m => m.ExpedienteDetalle) },
  { path: '', pathMatch: 'full', canActivate: [authGuard, permisoEmpleado], loadComponent: () => import('./pages/expedientes-list/expedientes-list').then(m => m.ExpedientesList) },
  { path: 'empleado/:idEmpleado', canActivate: [authGuard, expedienteLecturaGuard], loadComponent: () => import('./pages/expediente-detalle/expediente-detalle').then(m => m.ExpedienteDetalle) },
  { path: ':idExpediente/subir-documento', canActivate: [authGuard, permisoEmpleado], loadComponent: () => import('./pages/subir-documento/subir-documento').then(m => m.SubirDocumento) },
];
