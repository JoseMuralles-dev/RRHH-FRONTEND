import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { API } from '../../../core/config/apis';
import { AprobacionConSolicitud, AprobacionPendiente, CrearSolicitudRequest, Solicitud, TipoIncidencia } from '../models/solicitud.model';

export function errorSolicitud(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Ocurrió un error inesperado. Intenta nuevamente.';
  if (error.status === 0) return 'No se pudo conectar con el servidor.';
  if (error.status === 401) return 'Tu sesión venció. Inicia sesión nuevamente.';
  const mensaje: unknown = error.error?.message;
  if (Array.isArray(mensaje)) return mensaje.filter(m => typeof m === 'string').join('\n') || 'Revisa los datos enviados.';
  if (typeof mensaje === 'string' && mensaje.trim()) return mensaje;
  if (error.status === 403) return 'No tienes permiso para esta acción o todavía no es tu turno.';
  if (error.status === 404) return 'No se encontró la solicitud o el tipo de incidencia.';
  return 'No se pudo completar la operación. Intenta nuevamente.';
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly url = `${API.baseUrl}${API.solicitudes.base}`;

  private sesion<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.auth.logout();
        void this.router.navigate(['/login']);
      }
      return throwError(() => error);
    }));
  }

  tipos() { return this.sesion(this.http.get<TipoIncidencia[]>(`${API.baseUrl}${API.solicitudes.tipos}`)); }
  mias() { return this.sesion(this.http.get<Solicitud[]>(`${API.baseUrl}${API.solicitudes.mias}`)); }
  pendientes() { return this.sesion(this.http.get<AprobacionPendiente[]>(`${API.baseUrl}${API.solicitudes.pendientes}`)); }
  aprobadas() { return this.sesion(this.http.get<AprobacionConSolicitud[]>(`${API.baseUrl}${API.solicitudes.aprobadas}`)); }
  detalle(id: number) { return this.sesion(this.http.get<Solicitud>(`${this.url}/${id}`)); }
  crear(data: CrearSolicitudRequest) { return this.sesion(this.http.post<Solicitud>(this.url, data)); }
  aprobar(id: number, comentario: string) { return this.sesion(this.http.patch<Solicitud>(`${this.url}/${id}/aprobar`, { comentario })); }
  rechazar(id: number, comentario: string) { return this.sesion(this.http.patch<Solicitud>(`${this.url}/${id}/rechazar`, { comentario })); }
  cancelar(id: number) { return this.sesion(this.http.patch<Solicitud>(`${this.url}/${id}/cancelar`, null)); }
}
