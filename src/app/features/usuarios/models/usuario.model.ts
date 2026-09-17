export interface Rol {
  idRol: number;
  codigoRol?: string;
  nombreRol?: string;
  nivelJerarquico?: number;
}

export interface Empleado {
  idEmpleado: number;
  primerNombre?: string;
  segundoNombre?: string | null;
  primerApellido?: string;
  segundoApellido?: string | null;
}

export interface Usuario {
  idUsuario: number;

  idEmpleado?: number | null;
  idRol: number;

  correo: string;

  estado: 'ACTIVO' | 'INACTIVO';

  isActive: boolean;

  rol?: Rol;
  empleado?: Empleado | null;
}

export interface CrearUsuarioRequest {
  correo: string;
  password: string;
  idRol: number;
  idEmpleado: number;
}

export interface ActualizarUsuarioRequest {
  idEmpleado?: number | null;
  idRol?: number;
  correo?: string;
  isActive?: boolean;
}

export interface CambiarPasswordRequest {
  password: string;
}
