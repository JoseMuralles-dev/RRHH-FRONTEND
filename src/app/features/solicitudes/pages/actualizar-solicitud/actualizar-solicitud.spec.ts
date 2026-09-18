import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { SOLICITUDES_ROUTES } from '../../solicitudes.routes';
import { SolicitudService } from '../../services/solicitud.service';
import { AuthService } from '../../../../core/services/auth';

describe('ActualizarSolicitud', () => {
  it('opens the existing edit route as a detail/action page without inventing an update endpoint', async () => {
    const detalle = vi.fn(() => of({ idSolicitud: 7, estado: 'CANCELADA', createdAt: '2026-09-17T12:00:00Z' }));
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'solicitudes', children: SOLICITUDES_ROUTES }]),
      { provide: SolicitudService, useValue: { detalle } },
      { provide: AuthService, useValue: { getUsuarioSesion: () => ({ idUsuario: 1, idEmpleado: 10, nivelJerarquico: 1 }) } }] });
    const harness = await RouterTestingHarness.create('/solicitudes/7/editar');
    expect(detalle).toHaveBeenCalledWith(7);
    expect(harness.routeNativeElement?.textContent).toContain('no se pueden editar');
    expect(harness.routeNativeElement?.textContent).toContain('Solicitud #7');
  });
});
