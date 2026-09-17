import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { API } from '../../../core/config/apis';
import { AuthService } from '../../../core/services/auth';
import { Empleado, EmpleadoDatos, EmpleadoOpcion } from '../models/empleado.model';

export function mensajeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Ocurrió un error inesperado. Intenta nuevamente.';
  if (error.status === 0) return 'No se pudo conectar con el servidor. Comprueba la conexión e intenta nuevamente.';
  if (error.status === 401) return 'La sesión no es válida o ha vencido. Inicia sesión nuevamente.';
  if (error.status === 403) return 'No tienes permisos suficientes para realizar esta acción.';
  const message: unknown = error.error?.message;
  if (Array.isArray(message)) {
    const messages = message.filter((m): m is string => typeof m === 'string');
    if (messages.length) return messages.join('\n');
  }
  if (typeof message === 'string' && message.trim()) return message;
  switch (error.status) {
    case 400: return 'Revisa los datos y parámetros enviados.';
    case 404: return 'No se encontró el empleado o una de las referencias seleccionadas.';
    case 409: return 'Los datos entran en conflicto con otro registro. Revisa DPI, IGSS y código SAP.';
    default: return 'No se pudo completar la operación. Intenta nuevamente.';
  }
}

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly url = `${API.baseUrl}${API.empleados.base}`;

  private sesion<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.auth.logout();
        void this.router.navigate(['/login']);
      }
      return throwError(() => error);
    }));
  }

  listar() { return this.sesion(this.http.get<Empleado[]>(this.url)); }
  obtener(id: number) { return this.sesion(this.http.get<Empleado>(`${this.url}/${id}`)); }
  select() { return this.sesion(this.http.get<EmpleadoOpcion[]>(`${this.url}/select`)); }
  buscar(texto: string) {
    return this.sesion(this.http.get<Empleado[]>(`${this.url}/buscar`, { params: { texto: texto.trim() } }));
  }
  crear(data: EmpleadoDatos) { return this.sesion(this.http.post<Empleado>(this.url, data)); }
  actualizar(id: number, data: Partial<EmpleadoDatos>) {
    return this.sesion(this.http.patch<Empleado>(`${this.url}/${id}`, data));
  }
  desactivar(id: number) {
    return this.sesion(this.http.patch<void>(`${this.url}/${id}/desactivar`, null));
  }
}
