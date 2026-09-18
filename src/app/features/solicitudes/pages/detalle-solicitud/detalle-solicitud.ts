import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { SolicitudEstado } from '../../components/solicitud-estado/solicitud-estado';
import { Solicitud } from '../../models/solicitud.model';
import { errorSolicitud, SolicitudService } from '../../services/solicitud.service';
import { estaAbierta, nombreEmpleado, turnoDisponible } from '../../utils/solicitud-reglas';

@Component({ selector: 'app-detalle-solicitud', imports: [RouterLink, ReactiveFormsModule, DatePipe, SolicitudEstado],
  templateUrl: './detalle-solicitud.html', styleUrl: './detalle-solicitud.css' })
export class DetalleSolicitud implements OnInit {
  private readonly service = inject(SolicitudService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly solicitud = signal<Solicitud | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');
  readonly comentario = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] });
  readonly nombre = nombreEmpleado;
  readonly abierta = computed(() => { const s = this.solicitud(); return !!s && estaAbierta(s); });
  readonly aprobaciones = computed(() => [...(this.solicitud()?.aprobaciones ?? [])].sort((a, b) => a.nivelAprobacion - b.nivelAprobacion));
  readonly puedeResolver = computed(() => {
    const s = this.solicitud(), usuario = this.auth.getUsuarioSesion();
    return !!s && !!usuario && usuario.idEmpleado !== s.idEmpleado
      && turnoDisponible(s)?.idUsuarioAprobador === usuario.idUsuario;
  });
  readonly puedeCancelar = computed(() => {
    const s = this.solicitud(), usuario = this.auth.getUsuarioSesion();
    return !!s && !!usuario && estaAbierta(s) && (s.idEmpleado === usuario.idEmpleado || usuario.nivelJerarquico >= 4);
  });
  ngOnInit() { this.cargar(); }
  cargar() {
    if (this.loading()) return;
    if (!Number.isSafeInteger(this.id) || this.id < 1) { this.error.set('El ID de solicitud no es v?lido.'); return; }
    this.loading.set(true); this.error.set(''); this.solicitud.set(null);
    this.service.detalle(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: solicitud => { this.solicitud.set(solicitud); this.loading.set(false); },
      error: error => { this.error.set(errorSolicitud(error)); this.loading.set(false); },
    });
  }
  resolver(accion: 'aprobar' | 'rechazar' | 'cancelar') {
    if (this.saving() || this.loading() || !this.solicitud()) return;
    this.error.set(''); this.aviso.set('');
    if (accion === 'cancelar') {
      if (!this.puedeCancelar() || !window.confirm('?Cancelar esta solicitud? Esta acci?n no se puede deshacer.')) return;
    } else {
      if (!this.puedeResolver()) return;
      this.comentario.markAsTouched();
      if (this.comentario.invalid) { this.error.set('El comentario no puede superar 1000 caracteres.'); return; }
      if (accion === 'rechazar' && !this.comentario.value.trim()) { this.error.set('Indica el motivo del rechazo.'); return; }
    }
    const comentario = this.comentario.value.trim();
    const request = accion === 'cancelar' ? this.service.cancelar(this.id)
      : accion === 'aprobar' ? this.service.aprobar(this.id, comentario) : this.service.rechazar(this.id, comentario);
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false); this.comentario.reset();
        this.aviso.set(accion === 'aprobar' ? 'Tu aprobaci?n fue registrada.' : accion === 'rechazar' ? 'Solicitud rechazada.' : 'Solicitud cancelada.');
        this.cargar();
      },
      error: error => { this.saving.set(false); this.error.set(errorSolicitud(error)); },
    });
  }
}
