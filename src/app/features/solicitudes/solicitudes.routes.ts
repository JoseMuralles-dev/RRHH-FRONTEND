import { Routes } from '@angular/router';
import { SolicitudesList } from './pages/solicitudes-list/solicitudes-list';
import { CrearSolicitud } from './pages/crear-solicitud/crear-solicitud';
import { DetalleSolicitud } from './pages/detalle-solicitud/detalle-solicitud';
import { ActualizarSolicitud } from './pages/actualizar-solicitud/actualizar-solicitud';
import { solicitudesGuard } from './guards/solicitudes-guard';

export const SOLICITUDES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [solicitudesGuard],
    pathMatch: 'full',
    component: SolicitudesList
  },
  {
    path: 'nueva',
    canActivate: [solicitudesGuard],
    component: CrearSolicitud
  },
  {
    path: ':id',
    canActivate: [solicitudesGuard],
    component: DetalleSolicitud
  },
  {
    path: ':id/editar',
    canActivate: [solicitudesGuard],
    component: ActualizarSolicitud
  }
];
