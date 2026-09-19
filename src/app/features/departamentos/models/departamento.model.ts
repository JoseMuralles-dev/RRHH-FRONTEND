export interface PuestoOpcion {
  idPuesto: number; idDepartamento: number; nombrePuesto: string; isActive: boolean;
  departamento?: { nombreDepartamento: string; isActive: boolean } | null;
}
export interface Departamento {
  idDepartamento: number; nombreDepartamento: string; descripcion: string | null; isActive: boolean;
  puestos?: { idPuesto: number; nombrePuesto: string; isActive: boolean }[];
}
export interface DepartamentoDatos { nombreDepartamento: string; descripcion: string; }
