import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError } from 'rxjs';
import { API } from '../../../core/config/apis';
import { AuthService } from '../../../core/services/auth';
import { ActualizarDocumentoPayload, CrearExpedientePayload, DocumentoExpediente, Expediente, ExpedienteEmpleadoResponse, SubirDocumentoPayload, TipoDocumentoExpediente } from '../models/expediente.model';

export function errorExpediente(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'No se pudo completar la operación. Intenta nuevamente.';
  if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa la conexión.';
  if (error.status === 401) return 'Tu sesión venció. Inicia sesión nuevamente.';
  if (error.status === 403) return 'No tienes permiso para realizar esta acción.';
  if (error.status === 413) return 'El archivo supera el tamaño permitido de 10 MB.';
  const message: unknown = error.error?.message;
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string').join('\n');
  if (typeof message === 'string' && !message.startsWith('Cannot ')) return message;
  return error.status === 404 ? 'El expediente, documento o la operación solicitada no está disponible.' : 'No se pudo completar la operación. Intenta nuevamente.';
}
@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly url = API.baseUrl + API.expedientes.base;
  readonly capacidades = API.expedientes.capacidades;
  private sesion<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError(async (error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) { this.auth.logout(); void this.router.navigate(['/login']); }
        if (error.error instanceof Blob) {
          let detalle: unknown;
          try { detalle = JSON.parse(await error.error.text()); } catch { detalle = { message: 'No se pudo descargar el documento.' }; }
          throw new HttpErrorResponse({ error: detalle, status: error.status, statusText: error.statusText, url: error.url ?? undefined });
        }
      }
      throw error;
    }));
  }
  obtenerExpedienteEmpleado(id: number) { return this.sesion(this.http.get<ExpedienteEmpleadoResponse>(`${this.url}/empleado/${id}`)); }
  listarTiposDocumento() { return this.sesion(this.http.get<TipoDocumentoExpediente[]>(`${this.url}/tipos-documento`)); }
  crearExpediente(payload: CrearExpedientePayload) { return this.sesion(this.http.post<Expediente>(this.url, payload)); }
  subirDocumento(id: number, archivo: File, datos: SubirDocumentoPayload) {
    const form = new FormData(); form.append('archivo', archivo); form.append('idTipoDocumento', String(datos.idTipoDocumento));
    if (datos.fechaDocumento) form.append('fechaDocumento', datos.fechaDocumento);
    if (datos.fechaVencimiento) form.append('fechaVencimiento', datos.fechaVencimiento);
    if (datos.observaciones?.trim()) form.append('observaciones', datos.observaciones.trim());
    return this.sesion(this.http.post<DocumentoExpediente>(`${this.url}/${id}/documentos`, form));
  }
  descargarDocumento(idExpediente: number, id: number) { return this.sesion(this.http.get(`${this.url}/${idExpediente}/documentos/${id}/descargar`, { responseType: 'blob' })); }
  previsualizarDocumento(idExpediente: number, id: number) { return this.sesion(this.http.get(this.url + '/' + idExpediente + '/documentos/' + id + '/previsualizar', { responseType: 'blob' })); }
  actualizarDocumento(id: number, payload: ActualizarDocumentoPayload, archivo?: File) {
    let body: ActualizarDocumentoPayload | FormData = payload;
    if (archivo) {
      body = new FormData();
      body.append('archivo', archivo);
      Object.entries(payload).forEach(([key, value]) => { if (value !== undefined) (body as FormData).append(key, value); });
    }
    return this.sesion(this.http.patch<DocumentoExpediente>(`${this.url}/documentos/${id}`, body));
  }
  eliminarDocumento(id: number) { return this.sesion(this.http.delete<void>(`${this.url}/documentos/${id}`)); }
}
