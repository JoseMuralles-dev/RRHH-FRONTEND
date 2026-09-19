export interface KpiDashboardResponse {
  idEmpleado: number;

  periodo: KpiPeriodo;

  tieneDatos: boolean;

  ultimaCargaDiaria: string | null;

  diasConDatos: number;

  seriesDiarias: KpiSerieDiaria[];

  evaluaciones: KpiEvaluacion[];
}

export interface KpiPeriodo {
  anio: number;
  mes: number;
  fechaInicial: string;
  fechaFinal: string;
}

export interface KpiSerieDiaria {
  idMetrica: number;
  codigo: string;
  nombre: string;
  unidadMedida: string;

  puntos: KpiPuntoDiario[];
}

export interface KpiPuntoDiario {
  fecha: string;
  valor: number;
}

export interface KpiEvaluacion {
  idEvaluacion: number;
  idDepartamento: number;

  estado: string;

  puntajeBase: number;
  penalizacionTotal: number;
  notaFinal: number;
  metaGlobal: number;

  calculadaEn: string | null;

  resultados: KpiResultado[];
}

export interface KpiResultado {
  idResultado: number;
  idMetrica: number;

  codigo: string;
  nombre: string;
  unidadMedida: string;

  valorObtenido: number;
  metaAplicada: number;

  porcentajeCumplimiento: number | null;

  puntosObtenidos: number;

  observacion: string | null;

  detalles: KpiDetalle[];
}

export interface KpiDetalle {
  origen: string;
  valor: number;
  descripcion: string;
}

export interface KpiEmpleadoEquipo {
  empleado: {
    idEmpleado: number;
    nombre: string;
  };

  dashboard: KpiDashboardResponse;
}

export interface KpiEquipoResponse {
  idEncargado: number;

  periodo: {
    anio: number;
    mes: number;
  };

  totalSubordinados: number;

  empleados: KpiEmpleadoEquipo[];
}