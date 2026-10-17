import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { IaService, InformeIa, InformeResumen } from './ia.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-asistente-ia', standalone: true,
  imports: [CommonModule, FormsModule], templateUrl: './asistente-ia.html',
  styleUrl: './asistente-ia.css', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsistenteIa {
  private readonly ia = inject(IaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly enviando = signal(false);
  readonly cargandoInforme = signal(false);
  readonly cargandoHistorial = signal(false);
  readonly error = signal('');
  readonly errorHistorial = signal('');
  readonly historial = signal<InformeResumen[]>([]);
  readonly informe = signal<InformeIa | null>(null);
  private solicitudInforme?: Subscription;
  private solicitudHistorial?: Subscription;
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  pregunta = '';
  readonly meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly sugerencias = this.auth.getNivelJerarquico() === 1
    ? ['Resume mis KPI del mes y explica qué datos utilizaste.', '¿Cómo han evolucionado mis KPI en los últimos tres meses?']
    : ['Resume los KPI de mi equipo y explica qué datos utilizaste.', '¿Qué tendencias observas en mi equipo durante los últimos tres meses?'];

  constructor() {
    this.cargarHistorial();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('informe'));
      if (Number.isSafeInteger(id) && id > 0) this.abrir(id);
    });
  }

  cargarHistorial() {
    this.solicitudHistorial?.unsubscribe();
    this.cargandoHistorial.set(true); this.errorHistorial.set('');
    this.solicitudHistorial = this.ia.historial().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: lista => { this.historial.set(lista); this.cargandoHistorial.set(false); },
      error: () => { this.errorHistorial.set('No se pudo cargar el historial.'); this.cargandoHistorial.set(false); },
    });
  }
  sugerir(texto: string) { if (!this.enviando()) this.pregunta = texto; }

  enviar() {
    if (this.enviando()) return;
    const consulta = { anio: Number(this.anio), mes: Number(this.mes), pregunta: this.pregunta.trim() };
    if (!Number.isInteger(consulta.anio) || consulta.anio < 2000 || consulta.anio > 2100 ||
        !Number.isInteger(consulta.mes) || consulta.mes < 1 || consulta.mes > 12 ||
        consulta.pregunta.length < 3 || consulta.pregunta.length > 1500) {
      this.error.set('Elige un período válido y escribe una pregunta de 3 a 1500 caracteres.'); return;
    }
    this.solicitudInforme?.unsubscribe();
    this.cargandoInforme.set(false); this.informe.set(null); this.error.set(''); this.enviando.set(true);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { informe: null }, queryParamsHandling: 'merge', replaceUrl: true });
    this.ia.analizar(consulta).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: respuesta => {
        this.enviando.set(false);
        this.informe.set({ idInforme: respuesta.idInforme, ...consulta, origen: 'CONSULTA',
          createdAt: new Date().toISOString(), respuesta: respuesta.respuesta,
          puntosClave: null, recomendaciones: null, fuentes: null });
        this.cargarHistorial();
      },
      error: err => { this.enviando.set(false); this.error.set(this.mensajeError(err)); },
    });
  }

  seleccionar(id: number) {
    if (!this.enviando()) void this.router.navigate([], { relativeTo: this.route, queryParams: { informe: id } });
  }
  private abrir(id: number) {
    if (this.enviando()) return;
    this.solicitudInforme?.unsubscribe();
    this.informe.set(null); this.error.set(''); this.cargandoInforme.set(true);
    this.solicitudInforme = this.ia.informe(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: informe => { this.informe.set(informe); this.cargandoInforme.set(false); },
      error: err => { this.error.set(this.mensajeError(err)); this.cargandoInforme.set(false); },
    });
  }
  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
      if (error.status === 403) return 'No tienes permisos para consultar estos datos.';
      if (error.status === 404) return 'Este informe no está disponible para tus permisos actuales.';
      if (error.status === 409) return 'Hay otro análisis en curso o tus permisos cambiaron. Espera y vuelve a intentarlo.';
      if (error.status === 429) return 'Alcanzaste el límite de 20 consultas por hora. Intenta más tarde.';
      if (error.status === 502 || error.status === 503) return 'No se pudo completar el análisis. El servicio de IA no está disponible o devolvió una respuesta inválida.';
      if (error.status === 504) return 'El análisis tardó demasiado. Vuelve a intentarlo.';
    }
    return 'No se pudo completar la consulta. Revisa tu conexión e intenta nuevamente.';
  }
}
