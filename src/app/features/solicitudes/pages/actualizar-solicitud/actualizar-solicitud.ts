import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { SolicitudForm } from '../../components/solicitud-form/solicitud-form';
import { CrearSolicitudRequest, Solicitud } from '../../models/solicitud.model';
import { errorSolicitud, SolicitudService } from '../../services/solicitud.service';
import { puedeEditarVacaciones } from '../../utils/solicitud-reglas';
@Component({ selector: 'app-actualizar-solicitud', imports: [RouterLink, SolicitudForm], templateUrl: './actualizar-solicitud.html', styleUrl: './actualizar-solicitud.css' })
export class ActualizarSolicitud {
  private readonly service = inject(SolicitudService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly solicitud = signal<Solicitud | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  constructor() { this.cargar(); }
  cargar() {
    if (this.loading() || this.saving()) return;
    this.error.set(''); this.solicitud.set(null);
    if (!Number.isSafeInteger(this.id) || this.id <= 0) { this.error.set('Solicitud inválida.'); return; }
    this.loading.set(true);
    this.service.detalle(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: s => {
      this.loading.set(false);
      if (!puedeEditarVacaciones(s, this.auth.getUsuarioSesion()?.idEmpleado)) this.error.set('Solo puedes editar tus vacaciones pendientes, antes de que se responda una aprobación.');
      else this.solicitud.set(s);
    }, error: e => { this.loading.set(false); this.error.set(errorSolicitud(e)); } });
  }
  guardar(data: CrearSolicitudRequest) {
    const s = this.solicitud();
    if (!s || this.saving() || !puedeEditarVacaciones(s, this.auth.getUsuarioSesion()?.idEmpleado)) return;
    this.saving.set(true); this.error.set('');
    this.service.actualizar(this.id, { ...data, idTipoIncidencia: s.idTipoIncidencia }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void this.router.navigate(['/solicitudes', this.id]); },
      error: e => { this.saving.set(false); this.error.set(errorSolicitud(e)); },
    });
  }
}
