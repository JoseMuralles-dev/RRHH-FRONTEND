import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { SolicitudEstado } from '../../components/solicitud-estado/solicitud-estado';
import { Solicitud } from '../../models/solicitud.model';
import { errorSolicitud, SolicitudService } from '../../services/solicitud.service';
import { nombreEmpleado } from '../../utils/solicitud-reglas';

@Component({ selector: 'app-solicitudes-list', imports: [RouterLink, SolicitudEstado],
  templateUrl: './solicitudes-list.html', styleUrl: './solicitudes-list.css' })
export class SolicitudesList {
  private readonly auth = inject(AuthService);
  private readonly service = inject(SolicitudService);
  private readonly refresh = new Subject<void>();
  readonly vista = signal<'mias' | 'pendientes' | 'aprobadas'>(this.tieneEmpleado ? 'mias' : 'pendientes');
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly nombre = nombreEmpleado;
  get tieneEmpleado() { return !!this.auth.getUsuarioSesion()?.idEmpleado; }
  constructor() {
    this.refresh.pipe(startWith(undefined), switchMap(() => {
      this.loading.set(true); this.error.set('');
      const request = this.vista() === 'mias' ? this.service.mias()
        : (this.vista() === 'aprobadas' ? this.service.aprobadas() : this.service.pendientes()).pipe(map(aprobaciones => aprobaciones.map(a => a.solicitud)));
      return request.pipe(map(solicitudes => ({ solicitudes, error: '' })),
        catchError(error => of({ solicitudes: [] as Solicitud[], error: errorSolicitud(error) })));
    }), takeUntilDestroyed(inject(DestroyRef))).subscribe(result => {
      this.solicitudes.set(result.solicitudes); this.error.set(result.error); this.loading.set(false);
    });
  }
  cambiarVista(vista: 'mias' | 'pendientes' | 'aprobadas') {
    if (vista === 'mias' && !this.tieneEmpleado) return;
    this.vista.set(vista); this.refresh.next();
  }
  recargar() { this.refresh.next(); }
}
