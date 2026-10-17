import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API } from '../../../../core/config/apis';
export interface Vendedor { idEmpleado: number; nombre: string; }
export interface IndicadorVentas { reglaAplicada?: { configuracion?: { base?: string | number } }; codigo: string; pesoPorcentaje: number; valorObtenido: string | null; metaAplicada: string | null; estado: string; puntos: string | null; mesesFaltantes: number[]; explicacion?: string | null; }
export interface ResultadoVentas extends Vendedor { estado: string; notaFinal: string | null; fechaCorte?: string; actualizadoEn?: string; desactualizado?: boolean; cerrado?: boolean; provisional?: boolean; resultados: IndicadorVentas[]; }
export interface DashboardVentas { periodo: { anio: number; mes: number; fechaInicio: string; fechaFin: string; provisional: boolean }; criterios: string[]; empleados: ResultadoVentas[]; }
export interface MetaVentas { periodoMes: number; metaObjetivo: string; }
export function errorVentas(e: unknown): string {
  if (!(e instanceof HttpErrorResponse)) return 'No se pudo completar la consulta.';
  if (e.status === 0) return 'No se pudo conectar con el servidor.';
  if (e.status === 401) return 'Tu sesion vencio. Inicia sesion nuevamente.';
  if (e.status === 403) return 'No tienes acceso a estos datos de Ventas o no tienes un empleado de Ventas asociado.';
  if (e.status === 503) return 'SAP no esta disponible o devolvio datos invalidos. No se asignaron ventas en cero. Puedes reintentar.';
  const m = e.error?.message;
  if (typeof m === 'string' && m.includes('CONFIGURACION_VENTAS')) return 'Falta configurar las cinco metricas de Ventas. Contacta a administracion.';
  if (typeof m === 'string' && m.includes('PERIODO_CERRADO')) return 'El periodo esta cerrado o el cambio afectaria un acumulado cerrado.';
  return typeof m === 'string' && !m.startsWith('Cannot ') ? m : Array.isArray(m) ? m.join('. ') : 'No se pudo completar la operacion. Intenta nuevamente.';
}
@Injectable({providedIn:'root'})
export class VentasApi {
  private readonly http = inject(HttpClient);
  private readonly base = API.baseUrl + '/kpi/ventas';
  empleados() { return this.http.get<Vendedor[]>(this.base + '/empleados'); }
  dashboard(periodo: string, equipo: boolean) { const [anio,mes] = periodo.split('-'); return this.http.get<DashboardVentas>(this.base + (equipo ? '/equipo' : '/mi-dashboard'), {params:{anio,mes}}); }
  metas(idEmpleado: number, periodo: string) { const [anio,mes] = periodo.split('-'); return this.http.get<MetaVentas[]>(this.base+'/metas', {params:{idEmpleado,anio,mes}}); }
  guardarMeta(idEmpleado: number, periodo: string, metaObjetivo: string) { const [anio,mes] = periodo.split('-').map(Number); return this.http.put(this.base+'/metas',{idEmpleado,anio,mes,metaObjetivo}); }
  clientes(idEmpleado: number, fecha: string) { return this.http.get<{cantidad:number|null}>(this.base+'/nuevos-clientes',{params:{idEmpleado,fecha}}); }
  guardarClientes(idEmpleado: number, fecha: string, cantidad: number) { return this.http.put(this.base+'/nuevos-clientes',{idEmpleado,fecha,cantidad}); }
  evaluar(idEmpleado: number, periodo: string) { const [anio,mes] = periodo.split('-').map(Number); return this.http.post<DashboardVentas & {guardado:boolean}>(this.base+'/evaluaciones',{idEmpleado,anio,mes}); }
}

export function referenciaVentas(r: IndicadorVentas): string {
  const valor = r.metaAplicada ?? (r.codigo === 'VEN_CARTERA_SANA' ? r.reglaAplicada?.configuracion?.base : null);
  if (valor == null) return '?';
  return String(valor) + (['VEN_CARTERA_SANA', 'VEN_NOTAS_CREDITO'].includes(r.codigo) ? '%' : '');
}
