import { Component, input } from '@angular/core';
import { EstadoSolicitud } from '../../models/solicitud.model';

@Component({
  selector: 'app-solicitud-estado',
  templateUrl: './solicitud-estado.html',
  styleUrl: './solicitud-estado.css',
})
export class SolicitudEstado {
  readonly estado = input.required<EstadoSolicitud>();
  readonly etiquetas: Record<EstadoSolicitud, string> = {
    PENDIENTE: 'Pendiente', EN_REVISION: 'En revisi?n', APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada', CANCELADA: 'Cancelada',
  };
}
