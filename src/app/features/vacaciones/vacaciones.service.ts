import { inject, Injectable } from '@angular/core';
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
  private readonly url = API.baseUrl + '/vacaciones';
  mias(anio: number) {
    return this.http.get<MisVacaciones>(this.url + '/mis-vacaciones', { params: { anio } });
  }
  proximas() { return this.http.get<Vacacion[]>(this.url + '/proximas'); }
  historial(anio: number) {
    return this.http.get<{ anio: number; solicitudes: Vacacion[] }>(
      this.url + '/historial', { params: { anio } });
  }
}
