import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { Vacacion, VacacionesService } from './vacaciones.service';

type Vista = 'solicitudes' | 'proximas' | 'historial';
@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vacaciones.html',
  styleUrl: './vacaciones.css',
})
export class Vacaciones {
  private readonly service = inject(VacacionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cambios = new Subject<void>();
  readonly vista = signal<Vista>('solicitudes');
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly registros = signal<Vacacion[]>([]);
  readonly estado = signal('TODAS');
  anio = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Guatemala', year: 'numeric' }).format(new Date()));
  readonly estados = [
    { valor: 'TODAS', texto: 'Todas' }, { valor: 'PENDIENTE', texto: 'Pendientes' },
    { valor: 'APROBADA', texto: 'Aprobadas' }, { valor: 'RECHAZADA', texto: 'Rechazadas' },
    { valor: 'CANCELADA', texto: 'Canceladas' },
  ];
  readonly visibles = computed(() => this.registros().filter(r =>
    this.vista() !== 'solicitudes' || this.estado() === 'TODAS' ||
    r.estadoSolicitud === this.estado() ||
    (this.estado() === 'PENDIENTE' && r.estadoSolicitud === 'EN_REVISION')));
  constructor() {
    this.cambios.pipe(
      startWith(undefined),
      switchMap(() => {
        this.error.set('');
        this.registros.set([]);
        if (this.vista() !== 'proximas' &&
            (!Number.isInteger(this.anio) || this.anio < 1000 || this.anio > 9999)) {
          this.cargando.set(false);
          this.error.set('Ingresa un año válido entre 1000 y 9999.');
          return of(null);
        }
        this.cargando.set(true);
        let consulta: Observable<Vacacion[]>;
        if (this.vista() === 'proximas') consulta = this.service.proximas();
        else if (this.vista() === 'historial') consulta = this.service.historial(this.anio).pipe(map(r => r.solicitudes));
        else consulta = this.service.mias(this.anio).pipe(map(r =>
          [...r.pendientes, ...r.aprobadas, ...r.rechazadas, ...(r.canceladas ?? [])]
            .sort((a, b) => (a.fechaInicio ?? '').localeCompare(b.fechaInicio ?? '') || a.idSolicitud - b.idSolicitud)));
        return consulta.pipe(catchError((e: HttpErrorResponse) => {
          const mensaje = e.error?.message;
          this.error.set(e.status === 0 ? 'No se pudo conectar con el servidor. Intenta nuevamente.' :
            e.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' :
            e.status === 403 ? 'Tu usuario no tiene un empleado activo asociado para consultar vacaciones.' :
            typeof mensaje === 'string' ? mensaje : 'No se pudieron cargar las vacaciones. Intenta nuevamente.');
          if (e.status === 401) { this.auth.logout(); void this.router.navigate(['/login']); }
          return of(null);
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(registros => {
      this.registros.set(registros ?? []);
      this.cargando.set(false);
    });
  }
  cambiarVista(vista: Vista) {
    this.vista.set(vista);
    this.estado.set('TODAS');
    this.cargar();
  }
  cargar() { this.cambios.next(); }
  etiqueta(estado: string) { return estado === 'EN_REVISION' ? 'En revisión' : estado.charAt(0) + estado.slice(1).toLowerCase(); }
}
