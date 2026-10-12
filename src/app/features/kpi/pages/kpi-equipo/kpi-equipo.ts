import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import {KpiService} from '../../../../features/kpi/services/kpi.service';

import {
  KpiEmpleadoEquipo,
  KpiEquipoResponse,
  KpiEvaluacion,
  KpiResultado
} from '../../../../features/kpi/models/dashboard-kpi.model';
import { GraficaEquipo } from '../../components/grafica-equipo/grafica-equipo';
import { GraficaKpi } from '../../components/grafica-kpi/grafica-kpi';
import { GraficaSerieDiaria } from '../../components/grafica-serie-diaria/grafica-serie-diaria';

@Component({
  selector: 'app-kpi-equipo',
  standalone: true,

  imports: [
    RouterLink,
    CommonModule,
    ReactiveFormsModule,
    GraficaEquipo,
    GraficaKpi,
    GraficaSerieDiaria
],

  templateUrl: './kpi-equipo.html',
  styleUrl: './kpi-equipo.css'
})
export class KpiEquipo implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private solicitud?: Subscription;

  equipo: KpiEquipoResponse | null = null;
  departamentoSeleccionado = '';
  empleadoFiltro = '';

  get accesoGlobal(): boolean { return this.equipo?.alcance === 'TODOS_DEPARTAMENTOS'; }

  get departamentos(): { id: number; nombre: string }[] {
    const departamentos = new Map<number, string>();
    for (const item of this.equipo?.empleados ?? []) {
      if (item.empleado.idDepartamento != null) {
        departamentos.set(item.empleado.idDepartamento, item.empleado.departamento ?? 'Departamento ' + item.empleado.idDepartamento);
      }
    }
    return [...departamentos].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get empleadosDisponibles(): KpiEmpleadoEquipo[] {
    const empleados = this.equipo?.empleados ?? [];
    if (this.accesoGlobal && !this.departamentoSeleccionado) return [];
    return !this.departamentoSeleccionado ? empleados : empleados.filter(item =>
      String(item.empleado.idDepartamento) === this.departamentoSeleccionado);
  }

  get empleadosVisibles(): KpiEmpleadoEquipo[] {
    return this.empleadosDisponibles.filter(item => !this.empleadoFiltro ||
      String(item.empleado.idEmpleado) === this.empleadoFiltro);
  }

  get opcionesEmpleado(): KpiEmpleadoEquipo[] {
    return [...this.empleadosDisponibles].sort((a, b) => a.empleado.nombre.localeCompare(b.empleado.nombre));
  }

  filtrarEmpleado(id: string): void {
    this.empleadoFiltro = this.empleadosDisponibles.some(item => String(item.empleado.idEmpleado) === id) ? id : '';
    this.empleadoSeleccionado = null;
  }

  filtrarDepartamento(id: string): void {
    this.departamentoSeleccionado = id;
    this.empleadoFiltro = '';
    this.empleadoSeleccionado = null;
  }

  empleadoSeleccionado:
    KpiEmpleadoEquipo | null = null;

  loading = false;

  errorMessage = '';

  periodoForm: FormGroup;

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

  constructor(
    private fb: FormBuilder,
    private kpiService: KpiService
  ) {

    this.periodoForm =
      this.fb.group({
        anio: [0],
        mes: [0]
      });

  }

  ngOnInit(): void {

    this.inicializarPeriodo();

    this.cargarEquipo();

    this.periodoForm
      .valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {

        this.empleadoSeleccionado = null;

        this.cargarEquipo();

      });

  }

  inicializarPeriodo(): void {

    const hoy =
      new Date();

    const anioActual =
      hoy.getFullYear();

    const mesActual =
      hoy.getMonth() + 1;

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

  cargarEquipo(): void {

    const anio =
      Number(
        this.periodoForm.value.anio
      );

    const mes =
      Number(
        this.periodoForm.value.mes
      );

    if (!anio || !mes) {
      return;
    }

    this.solicitud?.unsubscribe();
    this.loading = true;
    this.cdr.markForCheck();

    this.errorMessage = '';
    this.equipo = null;
    this.empleadoSeleccionado = null;

    this.solicitud = this.kpiService
      .getMiEquipo(
        anio,
        mes
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({

        next: (response) => {

          this.equipo =
            response;
          if (this.departamentoSeleccionado && !this.departamentos.some(d => String(d.id) === this.departamentoSeleccionado)) {
            this.filtrarDepartamento('');
          }
          this.filtrarEmpleado(this.empleadoFiltro);
          this.cdr.markForCheck();

        },

        error: (error) => {

          console.error(
            'Error cargando KPI del equipo:',
            error
          );

          this.equipo = null;

          this.errorMessage =
            this.obtenerMensajeError(
              error
            );

        }

      });

  }

  seleccionarEmpleado(
    empleado: KpiEmpleadoEquipo
  ): void {

    this.empleadoSeleccionado =
      empleado;

  }

  cerrarDetalle(): void {

    this.empleadoSeleccionado =
      null;

  }

  evaluacionDe(
    empleado: KpiEmpleadoEquipo
  ): KpiEvaluacion | null {

    if (
      !empleado.dashboard
        .evaluaciones.length
    ) {

      return null;

    }

    return empleado.dashboard
      .evaluaciones[0];

  }

  notaFinal(
    empleado: KpiEmpleadoEquipo
  ): number | null {

    return this.evaluacionDe(
      empleado
    )?.notaFinal ?? null;

  }

  cumplimientoDe(empleado: KpiEmpleadoEquipo): { porcentaje: number | null; validas: number; total: number } {
    const metricas = new Map<number, number | null>();
    for (const evaluacion of empleado.dashboard.evaluaciones) {
      for (const resultado of evaluacion.resultados) {
        if (!metricas.has(resultado.idMetrica)) {
          const valor = resultado.porcentajeCumplimiento;
          metricas.set(resultado.idMetrica, typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 ? valor : null);
        }
      }
    }
    const valores = [...metricas.values()].filter((v): v is number => v !== null);
    return { porcentaje: valores.length ? valores.reduce((suma, v) => suma + v, 0) / valores.length : null,
      validas: valores.length, total: metricas.size };
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

    return (
      resultado.detalles?.length > 0
    );

  }

  private obtenerMensajeError(
    error: any
  ): string {

    const message =
      error?.error?.message;

    if (Array.isArray(message)) {

      return message.join(' ');

    }

    if (
      typeof message === 'string'
    ) {

      return message;

    }

    if (error.status === 401) {

      return 'La sesión ha expirado o no es válida.';

    }

    if (error.status === 403) {

      return 'No tiene permisos para consultar los KPI del equipo.';

    }

    return 'No fue posible cargar los KPI del equipo.';

  }

}
