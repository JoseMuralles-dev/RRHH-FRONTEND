import {
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

import {
  Notificacion,
  ContadorNotificaciones,
} from '../models/notificacion.model';

import {
  API,
} from '../../../core/config/apis';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {

  constructor(
    private readonly http: HttpClient,
  ) {}

  obtenerMias(): Observable<Notificacion[]> {

    return this.http.get<Notificacion[]>(
      API.baseUrl + API.notificaciones.mias,
    );
  }

  contarNoLeidas(): Observable<ContadorNotificaciones> {

    return this.http.get<ContadorNotificaciones>(
      API.baseUrl + API.notificaciones.noLeidas,
    );
  }

  marcarComoLeida(
    idNotificacion: number,
  ): Observable<Notificacion> {

    return this.http.patch<Notificacion>(
      API.baseUrl + API.notificaciones.marcarLeida(
        idNotificacion,
      ),
      {},
    );
  }

  marcarTodasComoLeidas(): Observable<{
    actualizadas: number;
  }> {

    return this.http.patch<{
      actualizadas: number;
    }>(
      API.baseUrl + API.notificaciones.marcarTodas,
      {},
    );
  }
}