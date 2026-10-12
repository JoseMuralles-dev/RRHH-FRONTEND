import { HttpErrorResponse } from '@angular/common/http';
import { errorSolicitud } from './solicitud.service';

describe('Detalle de errores de solicitudes', () => {
  it('muestra la incidencia que bloquea la conciliacion', () => {
    const message = errorSolicitud(new HttpErrorResponse({
      status: 409, error: { message: 'RRHH debe conciliar el historial', incidencias: ['Solicitud 2: aprobada sin consumo', null, 5] },
    }));
    expect(message).toContain('Solicitud 2: aprobada sin consumo');
    expect(message).not.toContain('null');
  });
  it('conserva los mensajes sin incidencias', () => {
    expect(errorSolicitud(new HttpErrorResponse({ status: 409, error: { message: 'Saldo insuficiente' } })))
      .toBe('Saldo insuficiente');
  });
});
