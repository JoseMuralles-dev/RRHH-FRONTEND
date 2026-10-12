import { DocumentoExpediente } from '../models/expediente.model';
export type Vencimiento = 'VIGENTE' | 'PROXIMO' | 'VENCIDO' | 'SIN_FECHA' | 'FECHA_INVALIDA';
export const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024;
export function hoyGuatemala(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat('en', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(fecha);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}
export function fechaCalendario(valor: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const tiempo = Date.parse(valor + 'T00:00:00Z');
  return Number.isFinite(tiempo) && new Date(tiempo).toISOString().slice(0, 10) === valor ? tiempo : null;
}
export function vencimiento(documento: Pick<DocumentoExpediente, 'fechaVencimiento'>, hoy = hoyGuatemala()): Vencimiento {
  if (!documento.fechaVencimiento) return 'SIN_FECHA';
  const fecha = fechaCalendario(documento.fechaVencimiento), actual = fechaCalendario(hoy);
  if (fecha === null || actual === null) return 'FECHA_INVALIDA';
  const dias = (fecha - actual) / 86400000;
  return dias < 0 ? 'VENCIDO' : dias <= 30 ? 'PROXIMO' : 'VIGENTE';
}
export const etiquetaVencimiento: Record<Vencimiento, string> = { VIGENTE: 'Vigente', PROXIMO: 'Próximo a vencer', VENCIDO: 'Vencido', SIN_FECHA: 'Sin vencimiento registrado', FECHA_INVALIDA: 'Revisar fecha' };
export function tamanoArchivo(valor: string | number | null): string {
  if (valor === null || valor === '') return 'Tamaño no disponible';
  const bytes = Number(valor);
  if (!Number.isFinite(bytes) || bytes < 0) return 'Tamaño no disponible';
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
export function validarArchivo(file: File): string {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || !/\.(pdf|jpe?g|png)$/i.test(file.name)) return 'Selecciona un PDF, JPG, JPEG o PNG con un tipo MIME válido.';
  if (!file.size) return 'El archivo está vacío.';
  return file.size > MAX_ARCHIVO_BYTES ? 'El archivo no puede superar 10 MB.' : '';
}
export function guardarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = nombre.replace(/[\\/]/g, '_');
  try { document.body.appendChild(link); link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
