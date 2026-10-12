export interface Notificacion {
  idNotificacion: number;

  tipo: string;

  titulo: string;

  mensaje: string;

  referenciaTipo: string | null;

  referenciaId: number | null;

  leida: boolean;

  fechaLectura: string | null;

  createdAt: string;
}

export interface ContadorNotificaciones {
  noLeidas: number;
}