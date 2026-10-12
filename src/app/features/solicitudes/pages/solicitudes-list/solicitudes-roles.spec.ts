import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudesList } from './solicitudes-list';
import { AuthService } from '../../../../core/services/auth';
import { SolicitudService } from '../../services/solicitud.service';
describe('Bandejas por rol', () => {
  it.each([1, 2, 3, 4])('muestra aprobaciones solo a roles habilitados: %s', nivelJerarquico => {
    const pendientes = vi.fn(() => of([]));
    TestBed.configureTestingModule({ imports: [SolicitudesList], providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { getUsuarioSesion: () => ({ idEmpleado: 10, nivelJerarquico }) } },
      { provide: SolicitudService, useValue: { mias: () => of([]), pendientes, aprobadas: () => of([]) } },
    ] });
    const f = TestBed.createComponent(SolicitudesList); f.detectChanges();
    expect(f.nativeElement.textContent.includes('Pendientes de mi aprobación')).toBe(nivelJerarquico !== 1);
    expect(f.nativeElement.textContent.includes('Aprobadas por mí')).toBe(nivelJerarquico !== 1);
    f.componentInstance.cambiarVista('pendientes');
    expect(pendientes).toHaveBeenCalledTimes(nivelJerarquico === 1 ? 0 : 1);
  });
});