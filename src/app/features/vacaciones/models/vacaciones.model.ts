import { EstadoSolicitud } from '../../solicitudes/models/solicitud.model';
export interface Pagina<T> { items: T[]; total: number; pagina: number; limite: number; }
export interface PeriodoDatos {
  fechaInicio: string; fechaFin: string; diasAsignados: string; diasUtilizadosIniciales: string;
  fechaCorteInicial: string | null; observaciones: string | null;
}
export interface PeriodoVacaciones extends PeriodoDatos { idPeriodo: number; idEmpleado: number; createdAt: string; updatedAt: string; }
export interface SaldoPeriodo {
  idPeriodo: number; fechaInicio: string; fechaFin: string; fechaCorteInicial: string | null;
  diasAsignados: string; diasUtilizadosIniciales: string; diasConsumidos: string; diasDevueltos: string;
  ajustesPositivos: string; ajustesNegativos: string; ajusteNeto: string; saldoDias: string;
}
export interface SaldoVacaciones {
  idEmpleado: number; saldoTotal: string; diasReservados: string; diasDisponibles: string;
  requiereConciliacion: boolean; incidencias: string[]; periodos: SaldoPeriodo[];
}
export interface AjusteVacaciones { tipoMovimiento: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'; dias: string; motivo: string; }
export interface MovimientoVacaciones {
  idMovimiento: number; idPeriodo: number; idSolicitud: number | null;
  tipoMovimiento: AjusteVacaciones['tipoMovimiento'] | 'CONSUMO' | 'DEVOLUCION';
  dias: string; motivo?: string; idEmpleadoRegistro: number; createdAt: string;
}
export interface CalendarioVacaciones {
  idSolicitud: number; empleado: { idEmpleado: number; nombre: string }; fechaInicio: string; fechaFin: string;
  diasSolicitados: number; estado: EstadoSolicitud;
}
export interface FilaSaldoVacaciones {
  idPeriodo: number; idEmpleado: number; nombreCompleto: string;
  fechaInicio: string; fechaFin: string; diasAsignados: string; diasUtilizadosIniciales: string;
  diasConsumidos: string; diasDevueltos: string; ajusteNeto: string; diasUtilizados: string; saldoDias: string;
}
export type OrdenSaldo = 'nombre' | 'saldo' | 'inicio';
