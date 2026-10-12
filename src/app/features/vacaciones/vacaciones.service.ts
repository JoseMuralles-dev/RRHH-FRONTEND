import { EmpleadoOpcion } from '../empleados/models/empleado.model';
import { FilaSaldoVacaciones, OrdenSaldo } from './models/vacaciones.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { AjusteVacaciones, CalendarioVacaciones, MovimientoVacaciones, Pagina, PeriodoDatos, PeriodoVacaciones, SaldoVacaciones } from './models/vacaciones.model';
﻿import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API } from '../../core/config/apis';

export interface Vacacion {
  idSolicitud: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  diasSolicitados: number | null;
  motivo: string;
  estadoSolicitud: string;
  fechaResolucion: string | null;
  nombreTipo: string;
}
export interface MisVacaciones {
  anio: number;
  pendientes: Vacacion[];
  aprobadas: Vacacion[];
  rechazadas: Vacacion[];
  canceladas: Vacacion[];
}
@Injectable({ providedIn: 'root' })
export class VacacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = API.baseUrl + API.vacaciones.base;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private sesion<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) { this.auth.logout(); void this.router.navigate(['/login']); }
      return throwError(() => error);
    }));
  }
  empleadosDisponibles() { return this.sesion(this.http.get<EmpleadoOpcion[]>(this.url + '/empleados-disponibles')); }
  tablaSaldos(pagina: number, idEmpleado: number | undefined, buscar: string, orden: OrdenSaldo, direccion: 'ASC' | 'DESC') {
    return this.sesion(this.http.get<Pagina<FilaSaldoVacaciones>>(this.url + '/saldos-tabla', {
      params: { pagina, limite: 20, buscar, orden, direccion, ...(idEmpleado ? { idEmpleado } : {}) },
    }));
  }
  saldo(idEmpleado?: number) { return this.sesion(this.http.get<SaldoVacaciones>(this.url + (idEmpleado ? '/empleados/' + idEmpleado + '/saldo' : '/mi-saldo'))); }
  movimientos(pagina = 1, idEmpleado?: number) { return this.sesion(this.http.get<Pagina<MovimientoVacaciones>>(this.url + (idEmpleado ? '/empleados/' + idEmpleado + '/movimientos' : '/mis-movimientos'), { params: { pagina, limite: 20 } })); }
  periodos(id: number, pagina = 1) { return this.sesion(this.http.get<Pagina<PeriodoVacaciones>>(this.url + '/empleados/' + id + '/periodos', { params: { pagina, limite: 20 } })); }
  guardarPeriodo(id: number, data: PeriodoDatos, periodo?: number) {
    const url = this.url + '/empleados/' + id + '/periodos';
    return this.sesion(periodo ? this.http.patch<PeriodoVacaciones>(url + '/' + periodo, data) : this.http.post<PeriodoVacaciones>(url, data));
  }
  ajustar(id: number, periodo: number, data: AjusteVacaciones) { return this.sesion(this.http.post<MovimientoVacaciones>(this.url + '/empleados/' + id + '/periodos/' + periodo + '/ajustes', data)); }
  calendario(desde: string, hasta: string, equipo = false, pagina = 1) { return this.sesion(this.http.get<Pagina<CalendarioVacaciones>>(this.url + '/calendario/' + (equipo ? 'equipo' : 'propio'), { params: { desde, hasta, pagina, limite: 20 } })); }
  mias(anio: number) {
    return this.http.get<MisVacaciones>(this.url + '/mis-vacaciones', { params: { anio } });
  }
  proximas() { return this.http.get<Vacacion[]>(this.url + '/proximas'); }
  historial(anio: number) {
    return this.http.get<{ anio: number; solicitudes: Vacacion[] }>(
      this.url + '/historial', { params: { anio } });
  }
}

export function errorVacaciones(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'No se pudo completar la operaci?n.';
  if (error.status === 0) return 'No se pudo conectar con el servidor. Intenta nuevamente.';
  if (error.status === 401) return 'Tu sesi?n venci?. Inicia sesi?n nuevamente.';
  const message: unknown = error.error?.message;
  const incidencias: unknown = error.error?.incidencias;
  return [typeof message === 'string' ? message : Array.isArray(message) ? message.filter(m => typeof m === 'string').join('\n') : error.status === 403 ? 'No tienes permiso para consultar este empleado o realizar esta acci?n.' : 'No se pudo completar la operaci?n.',
    Array.isArray(incidencias) ? incidencias.filter(i => typeof i === 'string').join('\n') : ''].filter(Boolean).join('\n');
}
