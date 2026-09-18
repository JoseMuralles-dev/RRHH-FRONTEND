export type EstadoSolicitud = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
export type EstadoAprobacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface TipoIncidencia {
  idTipoIncidencia: number;
  nombre: string;
  requierePeriodo: boolean;
  esRemunerado?: boolean;
  descuentaVacaciones?: boolean;
}

export interface CrearSolicitudRequest {
  idTipoIncidencia: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  diasSolicitados?: number | null;
  motivo: string;
}

export interface Aprobacion {
  idAprobacion: number;
  idSolicitud: number;
  idUsuarioAprobador: number;
  nivelAprobacion: number;
  estado: EstadoAprobacion;
  comentario?: string | null;
  fechaRespuesta?: string | null;
  usuarioAprobador?: { idUsuario: number; correo: string } | null;
}

export interface Solicitud extends CrearSolicitudRequest {
  idSolicitud: number;
  idEmpleado: number;
  estado: EstadoSolicitud;
  createdAt: string;
  fechaResolucion?: string | null;
  isActive: boolean;
  tipoIncidencia?: TipoIncidencia | null;
  empleado?: {
    primerNombre: string;
    segundoNombre?: string | null;
    primerApellido: string;
    segundoApellido?: string | null;
  } | null;
  aprobaciones?: Aprobacion[];
}

export interface AprobacionConSolicitud extends Aprobacion {
  solicitud: Solicitud;
}

export type AprobacionPendiente = AprobacionConSolicitud;
