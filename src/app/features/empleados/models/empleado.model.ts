export interface EmpleadoDatos {
  idPuesto: number;
  idJefeDirecto?: number | null;
  codigoSapEmpleado?: number | null;
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  dpi: string;
  igss: string;
  fechaNacimiento: string;
  fechaIngreso: string;
  sueldoActual: string;
  telefono?: string | null;
  direccion?: string | null;
}

export interface Empleado extends EmpleadoDatos {
  idEmpleado: number;
  isActive?: boolean;
  puesto?: {
    nombrePuesto: string;
    departamento?: { nombreDepartamento: string } | null;
  } | null;
  jefeDirecto?: Empleado | null;
  usuario?: { idUsuario: number; correo: string; estado?: string } | null;
}

export interface EmpleadoOpcion {
  idEmpleado: number;
  nombreCompleto: string;
}

export function nombreCompleto(empleado: Empleado): string {
  return [empleado.primerNombre, empleado.segundoNombre, empleado.primerApellido,
    empleado.segundoApellido].filter(Boolean).join(' ');
}

// Explicit allowlist: relations and server-owned fields never enter the request.
export function datosFormulario(e: EmpleadoDatos): EmpleadoDatos {
  return {
    idPuesto: e.idPuesto,
    idJefeDirecto: e.idJefeDirecto ?? null,
    codigoSapEmpleado: e.codigoSapEmpleado ?? null,
    primerNombre: e.primerNombre.trim(),
    segundoNombre: e.segundoNombre?.trim() ?? '',
    primerApellido: e.primerApellido.trim(),
    segundoApellido: e.segundoApellido?.trim() ?? '',
    dpi: e.dpi.trim(),
    igss: e.igss.trim(),
    fechaNacimiento: e.fechaNacimiento,
    fechaIngreso: e.fechaIngreso,
    sueldoActual: e.sueldoActual.trim(),
    telefono: e.telefono?.trim() ?? '',
    direccion: e.direccion?.trim() ?? '',
  };
}

export function cambiosEmpleado(original: EmpleadoDatos, actual: EmpleadoDatos): Partial<EmpleadoDatos> {
  return Object.fromEntries(Object.entries(actual).filter(([key, value]) =>
    value !== original[key as keyof EmpleadoDatos]));
}
