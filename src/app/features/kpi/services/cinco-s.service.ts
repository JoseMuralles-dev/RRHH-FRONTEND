import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/config/apis';

export interface CategoriaCincoS { id: number; nombre: string; criterios: { id: number; concepto: string; pregunta: string }[] }
export interface InspeccionCincoS { idInspeccion: number; numero: number; fecha: string; sucursal: string; encargado: string; inspector: string; puntos: number[]; total: number; observaciones: string | null }
export interface ResumenCincoS { idDepartamento: number; anio: number; mes: number; inspecciones: InspeccionCincoS[]; completo: boolean; promedio: number | null; puntosKpi: number | null; inspeccionesRegistradas: number; evaluacionesCreadas?: number; empleadosSinDatos?: number[]; evaluacionesActualizadas?: number }
export interface CatalogoCincoS { categorias: CategoriaCincoS[]; escala: string[]; departamentos: { idDepartamento: number; nombreDepartamento: string }[] }
export interface GuardarCincoS { idDepartamento: number; numero: number; fecha: string; sucursal: string; encargado: string; puntos: number[]; observaciones: string }
@Injectable({ providedIn: 'root' })
export class CincoSService {
  private readonly http = inject(HttpClient);
  private readonly url = API.baseUrl + '/kpi/cinco-s';
  catalogo() { return this.http.get<CatalogoCincoS>(this.url + '/catalogo'); }
  consultar(id: number, anio: number, mes: number) { return this.http.get<ResumenCincoS>(this.url + '/' + id, { params: { anio, mes } }); }
  recalcular(id: number, anio: number, mes: number) { return this.http.post<{ resumen: ResumenCincoS; evaluacionesActualizadas: number; evaluacionesCreadas: number; empleadosSinDatos: number[] }>(this.url + '/' + id + '/recalcular', {}, { params: { anio, mes } }); }
  guardar(datos: GuardarCincoS) { return this.http.post<ResumenCincoS>(this.url, datos); }
}
