import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Subscription, catchError, interval, startWith, switchMap } from 'rxjs';
import { Notificacion } from '../../models/notificacion.model';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-campana-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campana-notificaciones.component.html',
  styleUrl: './campana-notificaciones.component.css',
})
export class CampanaNotificacionesComponent implements OnInit, OnDestroy {
  abierto = false;
  cargando = false;
  noLeidas = 0;
  error = '';
  marcandoTodas = false;
  notificaciones: Notificacion[] = [];
  private readonly marcando = new Set<number>();
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificacionesService.contarNoLeidas().pipe(
        // Recuperar cada consulta permite reintentar en el siguiente intervalo.
        catchError(() => EMPTY),
      )),
    ).subscribe(respuesta => {
      this.noLeidas = respuesta.noLeidas;
      this.cdr.markForCheck();
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  toggle(): void {
    this.abierto = !this.abierto;
    if (this.abierto) this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';
    this.subscriptions.add(this.notificacionesService.obtenerMias().subscribe({
      next: notificaciones => {
        this.notificaciones = notificaciones;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar las notificaciones. Vuelve a abrir la campana para reintentar.';
        this.cargando = false;
        this.cdr.markForCheck();
      },
    }));
  }

  seleccionar(notificacion: Notificacion): void {
    if (this.marcandoTodas || this.marcando.has(notificacion.idNotificacion)) return;
    if (notificacion.leida) { this.navegar(notificacion); return; }
    this.marcando.add(notificacion.idNotificacion);
    this.error = '';
    this.subscriptions.add(this.notificacionesService.marcarComoLeida(notificacion.idNotificacion).subscribe({
      next: actualizada => {
        Object.assign(notificacion, actualizada);
        this.marcando.delete(notificacion.idNotificacion);
        this.actualizarContador();
        this.navegar(notificacion);
        this.cdr.markForCheck();
      },
      error: () => {
        this.marcando.delete(notificacion.idNotificacion);
        this.error = 'No se pudo marcar la notificación como leída. Intenta nuevamente.';
        this.cdr.markForCheck();
      },
    }));
  }

  marcarTodas(): void {
    if (this.marcandoTodas || this.marcando.size > 0) return;
    this.marcandoTodas = true;
    this.error = '';
    this.subscriptions.add(this.notificacionesService.marcarTodasComoLeidas().subscribe({
      next: () => {
        this.marcandoTodas = false;
        this.cargarNotificaciones();
        this.actualizarContador();
        this.cdr.markForCheck();
      },
      error: () => {
        this.marcandoTodas = false;
        this.error = 'No se pudieron marcar las notificaciones como leídas. Intenta nuevamente.';
        this.cdr.markForCheck();
      },
    }));
  }

  private actualizarContador(): void {
    this.subscriptions.add(this.notificacionesService.contarNoLeidas().subscribe({
      next: respuesta => { this.noLeidas = respuesta.noLeidas; this.cdr.markForCheck(); },
      error: () => { /* El intervalo vuelve a consultar el contador. */ },
    }));
  }

  private navegar(notificacion: Notificacion): void {
    this.abierto = false;
    if (notificacion.referenciaTipo === 'IA_INFORME' && notificacion.referenciaId) {
      void this.router.navigate(['/ia'], { queryParams: { informe: notificacion.referenciaId } });
      return;
    }
    if (notificacion.referenciaTipo === 'SOLICITUD_INCIDENCIA' && notificacion.referenciaId) {
      void this.router.navigate(['/solicitudes', notificacion.referenciaId]);
    }
  }

  get mostrarContador(): boolean { return this.noLeidas > 0; }
  get contadorTexto(): string { return this.noLeidas > 99 ? '99+' : String(this.noLeidas); }
}
