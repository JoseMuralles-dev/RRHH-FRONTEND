import { Aprobacion, Solicitud } from '../models/solicitud.model';

export function diasLaborables(inicio: string, fin: string): number | null {
  const fecha = (valor: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return NaN;
    const date = new Date(`${valor}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === valor ? date.getTime() : NaN;
  };
  const desde = fecha(inicio);
  const diferencia = fecha(fin) - desde;
  if (!Number.isFinite(diferencia) || diferencia < 0) return null;
  const calendario = diferencia / 86400000 + 1;
  let dias = Math.floor(calendario / 7) * 5;
  const primerDia = new Date(desde).getUTCDay();
  for (let i = 0; i < calendario % 7; i++) {
    const dia = (primerDia + i) % 7;
    if (dia !== 0 && dia !== 6) dias++;
  }
  return dias;
}

export function estaAbierta(solicitud: Solicitud): boolean {
  return solicitud.isActive && ['PENDIENTE', 'EN_REVISION'].includes(solicitud.estado);
}

export function turnoDisponible(solicitud: Solicitud): Aprobacion | undefined {
  if (!estaAbierta(solicitud)) return undefined;
  const aprobaciones = [...(solicitud.aprobaciones ?? [])].sort((a, b) => a.nivelAprobacion - b.nivelAprobacion);
  if (aprobaciones.length < 1 || aprobaciones.length > 2 || aprobaciones.some((a, index) => a.nivelAprobacion !== index + 1)) return undefined;
  const turno = aprobaciones.find(a => a.estado !== 'APROBADA');
  return turno?.estado === 'PENDIENTE' ? turno : undefined;
}

export function nombreEmpleado(solicitud: Solicitud): string {
  const e = solicitud.empleado;
  return e ? [e.primerNombre, e.segundoNombre, e.primerApellido, e.segundoApellido].filter(Boolean).join(' ')
    : `Empleado #${solicitud.idEmpleado}`;
}
