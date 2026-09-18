import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { SolicitudForm } from '../../components/solicitud-form/solicitud-form';
import { CrearSolicitudRequest, TipoIncidencia } from '../../models/solicitud.model';
import { errorSolicitud, SolicitudService } from '../../services/solicitud.service';

@Component({ selector: 'app-crear-solicitud', imports: [RouterLink, SolicitudForm],
  templateUrl: './crear-solicitud.html', styleUrl: './crear-solicitud.css' })
export class CrearSolicitud implements OnInit {
  private readonly service = inject(SolicitudService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly tipos = signal<TipoIncidencia[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly errorTipos = signal('');
  get tieneEmpleado() { return !!this.auth.getUsuarioSesion()?.idEmpleado; }
  ngOnInit() { if (this.tieneEmpleado) this.cargarTipos(); }
  cargarTipos() {
    if (this.loading()) return;
    this.loading.set(true); this.errorTipos.set('');
    this.service.tipos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: tipos => { this.tipos.set(tipos); this.loading.set(false); },
      error: error => { this.errorTipos.set(errorSolicitud(error)); this.loading.set(false); },
    });
  }
  guardar(data: CrearSolicitudRequest) {
    if (this.saving() || !this.tieneEmpleado || this.loading() || this.errorTipos() || !this.tipos().length) return;
    this.saving.set(true); this.error.set('');
    this.service.crear(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: solicitud => { void this.router.navigate(['/solicitudes', solicitud.idSolicitud]); },
      error: error => { this.error.set(errorSolicitud(error)); this.saving.set(false); },
    });
  }
}
