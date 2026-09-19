import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API } from '../../../core/config/apis';
import { Departamento, DepartamentoDatos, PuestoOpcion } from '../models/departamento.model';

@Injectable({ providedIn: 'root' })
export class DepartamentoService {
  private readonly http = inject(HttpClient);
  private readonly url = API.baseUrl + API.departamentos.base;
  listar() { return this.http.get<Departamento[]>(this.url); }
  obtener(id: number) { return this.http.get<Departamento>(this.url + '/' + id); }
  crear(datos: DepartamentoDatos) { return this.http.post<Departamento>(this.url, datos); }
  actualizar(id: number, datos: DepartamentoDatos) { return this.http.patch<Departamento>(this.url + '/' + id, datos); }
  desactivar(id: number) { return this.http.patch<Departamento>(this.url + '/' + id + '/desactivar', {}); }
  puestos() { return this.http.get<PuestoOpcion[]>(API.baseUrl + '/puestos'); }
}
export function errorDepartamento(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'No se pudo completar la operación.';
  if (error.status === 0) return 'No se pudo conectar con el servidor.';
  if (error.status === 401) return 'Tu sesión venció. Inicia sesión nuevamente.';
  const message = error.error?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  if (error.status === 403) return 'No tienes permiso para esta operación.';
  return 'No se pudo completar la operación. Intenta nuevamente.';
}
