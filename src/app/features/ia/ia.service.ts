import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { API } from '../../core/config/apis';

export interface ConsultaIa { anio: number; mes: number; pregunta: string; }
export interface RespuestaIa { ok: true; respuesta: string; periodo: { anio: number; mes: number }; idInforme: number; }
export interface InformeResumen {
  idInforme: number; anio: number; mes: number; origen: 'CONSULTA' | 'AUTOMATICO'; pregunta: string; createdAt: string;
}
export interface InformeIa extends InformeResumen {
  respuesta: string; puntosClave: string[] | null; recomendaciones: string[] | null; fuentes: string[] | null;
}
@Injectable({ providedIn: 'root' })
export class IaService {
  private readonly http = inject(HttpClient);
  private readonly url = API.baseUrl + '/ia';
  analizar(consulta: ConsultaIa) {
    return this.http.post<RespuestaIa>(this.url + '/analizar', consulta).pipe(timeout(130000));
  }
  historial() { return this.http.get<InformeResumen[]>(this.url + '/informes'); }
  informe(id: number) { return this.http.get<InformeIa>(this.url + '/informes/' + id); }
}
