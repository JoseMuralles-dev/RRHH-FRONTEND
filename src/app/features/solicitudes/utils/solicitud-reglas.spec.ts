import { diasLaborables, turnoDisponible } from './solicitud-reglas';
import { Solicitud } from '../models/solicitud.model';

describe('Reglas de solicitudes', () => {
  it('counts Monday-Friday, including leap days and both endpoints', () => {
    expect(diasLaborables('2026-09-18', '2026-09-21')).toBe(2);
    expect(diasLaborables('2026-09-14', '2026-09-27')).toBe(10);
    expect(diasLaborables('2024-02-28', '2024-03-01')).toBe(3);
    expect(diasLaborables('2026-09-21', '2026-09-21')).toBe(1);
    expect(diasLaborables('2026-09-19', '2026-09-20')).toBe(0);
  });
  it('rejects invalid and inverted dates', () => {
    expect(diasLaborables('2026-02-30', '2026-03-01')).toBeNull();
    expect(diasLaborables('2026-09-21', '2026-09-18')).toBeNull();
  });
  it('allows the only assigned approval and stops after resolution', () => {
    const s = { estado: 'PENDIENTE', isActive: true, aprobaciones: [
      { idAprobacion: 1, nivelAprobacion: 1, estado: 'PENDIENTE' },
    ] } as Solicitud;
    expect(turnoDisponible(s)?.idAprobacion).toBe(1);
    s.aprobaciones![0].estado = 'APROBADA';
    expect(turnoDisponible(s)).toBeUndefined();
    s.estado = 'RECHAZADA';
    expect(turnoDisponible(s)).toBeUndefined();
  });
  it('rejects empty or nonconsecutive approval levels', () => {
    const s = { estado: 'PENDIENTE', isActive: true, aprobaciones: [] } as unknown as Solicitud;
    expect(turnoDisponible(s)).toBeUndefined();
    s.aprobaciones = [{ idAprobacion: 1, idSolicitud: 1, idUsuarioAprobador: 2, nivelAprobacion: 2, estado: 'PENDIENTE' }];
    expect(turnoDisponible(s)).toBeUndefined();
  });
  it('enforces ordered approvals and terminal states', () => {
    const s = { estado: 'PENDIENTE', isActive: true, aprobaciones: [
      { idAprobacion: 2, nivelAprobacion: 2, estado: 'PENDIENTE' },
      { idAprobacion: 1, nivelAprobacion: 1, estado: 'PENDIENTE' },
    ] } as Solicitud;
    expect(turnoDisponible(s)?.idAprobacion).toBe(1);
    s.aprobaciones![1].estado = 'APROBADA';
    expect(turnoDisponible(s)?.idAprobacion).toBe(2);
    s.estado = 'CANCELADA';
    expect(turnoDisponible(s)).toBeUndefined();
  });
});
