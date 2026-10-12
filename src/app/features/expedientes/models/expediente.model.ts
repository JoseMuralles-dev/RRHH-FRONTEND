import type { Empleado } from '../../empleados/models/empleado.model';

export interface TipoDocumentoExpediente {
  idTipoDocumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esObligatorio: boolean;
  requiereVencimiento: boolean;
  isActive: boolean;
}

export interface DocumentoExpediente {
  idDocumento: number;
  idExpediente: number;
  idTipoDocumento: number;
  nombreOriginal: string;
  nombreArchivo: string;
  rutaArchivo: string;
  mimeType: string | null;
  tamanoBytes: string | null;
  fechaDocumento: string | null;
  fechaVencimiento: string | null;
  estado: string;
  observaciones: string | null;
  idUsuarioCarga: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tipoDocumento?: TipoDocumentoExpediente;
}

export interface Expediente {
  idExpediente: number;
  idEmpleado: number;
  fechaApertura: string;
  estado: string;
  observaciones: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documentos?: DocumentoExpediente[];
  empleado?: Empleado | null;
}

// El endpoint devuelve directamente el expediente, sin envoltorio.
export type ExpedienteEmpleadoResponse = Expediente;

export interface CrearExpedientePayload {
  idEmpleado: number;
  fechaApertura: string;
  observaciones?: string;
}

export interface SubirDocumentoPayload {
  idTipoDocumento: number;
  fechaDocumento?: string;
  fechaVencimiento?: string;
  observaciones?: string;
}

export interface ActualizarDocumentoPayload {
  fechaDocumento?: string;
  fechaVencimiento?: string;
  estado?: string;
  observaciones?: string;
}

