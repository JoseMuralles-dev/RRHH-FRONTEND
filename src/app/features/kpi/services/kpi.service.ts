import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { API } from '../../../core/config/apis';


import {
  KpiDashboardResponse,
  KpiEvaluacion,
  KpiResultado,
  KpiEquipoResponse
} from '../../kpi/models/dashboard-kpi.model';

@Injectable({
  providedIn: 'root'
})
export class KpiService {

  constructor(
    private http: HttpClient
  ) {}

  getMiDashboard(
    anio: number,
    mes: number
  ): Observable<KpiDashboardResponse> {

    const params =
      new HttpParams()
        .set(
          'anio',
          anio.toString()
        )
        .set(
          'mes',
          mes.toString()
        );

    return this.http.get<KpiDashboardResponse>(
      API.baseUrl + API.kpi.miDashboard,
      {
        params
      }
    );

  }
  getMiEquipo(
  anio: number,
  mes: number
): Observable<KpiEquipoResponse> {

  const params =
    new HttpParams()
      .set('anio', anio.toString())
      .set('mes', mes.toString());

  return this.http.get<KpiEquipoResponse>(
    API.baseUrl + API.kpi.miEquipo,
    {
      params
    }
  );
}

}