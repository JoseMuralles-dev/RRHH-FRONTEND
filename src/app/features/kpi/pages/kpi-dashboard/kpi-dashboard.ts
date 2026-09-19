import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
   FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import {
  KpiService
} from '../../../kpi/services/kpi.service';

import {
  KpiDashboardResponse,
  KpiEvaluacion,
  KpiResultado
} from '../../../kpi/models/dashboard-kpi.model';


@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl: './kpi-dashboard.html',
  styleUrl: './kpi-dashboard.css'
})
export class KpiDashboard implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private solicitud?: Subscription;

  dashboard: KpiDashboardResponse | null = null;

  loading = false;
  errorMessage = '';

  anios: number[] = [];

  meses = [
    { numero: 1, nombre: 'Enero' },
    { numero: 2, nombre: 'Febrero' },
    { numero: 3, nombre: 'Marzo' },
    { numero: 4, nombre: 'Abril' },
    { numero: 5, nombre: 'Mayo' },
    { numero: 6, nombre: 'Junio' },
    { numero: 7, nombre: 'Julio' },
    { numero: 8, nombre: 'Agosto' },
    { numero: 9, nombre: 'Septiembre' },
    { numero: 10, nombre: 'Octubre' },
    { numero: 11, nombre: 'Noviembre' },
    { numero: 12, nombre: 'Diciembre' }
  ];

  periodoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private kpiService: KpiService
  ) {

    this.periodoForm = this.fb.group({
      anio: [0],
      mes: [0]
    });

  }

  ngOnInit(): void {

    this.inicializarPeriodos();

    this.cargarDashboard();

    this.periodoForm
      .valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cargarDashboard();
      });

  }

  inicializarPeriodos(): void {

    const fechaActual = new Date();

    const anioActual =
      fechaActual.getFullYear();

    const mesActual =
      fechaActual.getMonth() + 1;

    for (
      let anio = anioActual;
      anio >= anioActual - 5;
      anio--
    ) {
      this.anios.push(anio);
    }

    this.periodoForm.setValue(
      {
        anio: anioActual,
        mes: mesActual
      },
      {
        emitEvent: false
      }
    );

  }

  cargarDashboard(): void {

    const anio =
      this.periodoForm.value.anio;

    const mes =
      this.periodoForm.value.mes;

    if (!anio || !mes) {
      return;
    }

    this.solicitud?.unsubscribe();
    this.loading = true;
    this.cdr.markForCheck();
    this.errorMessage = '';
    this.dashboard = null;

    this.solicitud = this.kpiService
      .getMiDashboard(
        anio,
        mes
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: (response) => {

          this.dashboard = response;

          this.loading = false;
          this.cdr.markForCheck();

        },

        error: (error) => {

          console.error(
            'Error cargando dashboard KPI:',
            error
          );

          this.loading = false;
          this.cdr.markForCheck();

          this.errorMessage =
            this.obtenerMensajeError(
              error
            );

        }

      });

  }

  get evaluacionPrincipal():
    KpiEvaluacion | null {

    if (
      !this.dashboard ||
      this.dashboard.evaluaciones.length === 0
    ) {
      return null;
    }

    return this.dashboard
      .evaluaciones[0];

  }

  limitarPorcentaje(
    porcentaje: number | null
  ): number {

    if (
      porcentaje === null ||
      porcentaje === undefined
    ) {
      return 0;
    }

    return Math.min(
      Math.max(
        porcentaje,
        0
      ),
      100
    );

  }

  tieneDetalles(
    resultado: KpiResultado
  ): boolean {

    return resultado.detalles.length > 0;

  }

  private obtenerMensajeError(
    error: any
  ): string {

    const message =
      error?.error?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (typeof message === 'string') {
      return message;
    }

    if (error.status === 401) {
      return 'La sesión ha expirado o no es válida.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para consultar este dashboard.';
    }

    if (error.status === 404) {
      return 'No se encontró información para el período seleccionado.';
    }

    return 'No fue posible cargar la información de KPI.';
  }

}