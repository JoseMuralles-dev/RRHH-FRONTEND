import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CincoSService, CatalogoCincoS, InspeccionCincoS, ResumenCincoS } from '../../services/cinco-s.service';
import { errorDepartamento } from '../../../departamentos/services/departamento.service';
import { hoyGuatemala } from '../../../expedientes/utils/documento-utils';

@Component({
  selector: 'app-cinco-s', imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './cinco-s.html', styleUrl: './cinco-s.css',
})
export class CincoS {
  private readonly service = inject(CincoSService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly catalogo = signal<CatalogoCincoS | null>(null);
  readonly resumen = signal<ResumenCincoS | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');
  readonly ver = signal<InspeccionCincoS | null>(null);
  readonly valores = signal<(number | null)[]>(Array(20).fill(null));
  readonly respondidos = computed(() => this.valores().filter(v => v !== null).length);
  readonly total = computed(() => this.valores().reduce<number>((a, b) => a + (b ?? 0), 0));
  readonly filtro = this.fb.nonNullable.group({ idDepartamento: [0, [Validators.required, Validators.min(1)]], periodo: [hoyGuatemala().slice(0, 7), Validators.required] });
  readonly puntos = new FormArray(Array.from({ length: 20 }, () => new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(5)])));
  readonly form = this.fb.nonNullable.group({
    numero: [1, Validators.required], fecha: [hoyGuatemala(), Validators.required],
    sucursal: ['', [Validators.required, Validators.maxLength(100)]],
    encargado: ['', [Validators.required, Validators.maxLength(150)]],
    observaciones: ['', Validators.maxLength(5000)], puntos: this.puntos,
  });

  constructor() {
    this.puntos.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.valores.set(v));
    this.cargarCatalogo();
  }
  subtotal(indice: number) { return this.valores().slice(indice * 4, indice * 4 + 4).reduce<number>((a, b) => a + (b ?? 0), 0); }
  cargarCatalogo() {
    this.loading.set(true); this.error.set('');
    this.service.catalogo().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      next: c => { this.catalogo.set(c); this.filtro.controls.idDepartamento.setValue(c.departamentos[0]?.idDepartamento ?? 0); },
      error: e => this.error.set(errorDepartamento(e)),
    });
  }
  consultar() {
    if (this.loading() || this.saving() || this.filtro.invalid) return;
    if (this.form.dirty && !window.confirm('Hay una inspección sin guardar. ¿Descartar los cambios?')) return;
    const { idDepartamento, periodo } = this.filtro.getRawValue();
    if (!/^\d{4}-\d{2}$/.test(periodo)) return;
    const [anio, mes] = periodo.split('-').map(Number);
    this.loading.set(true); this.error.set(''); this.aviso.set(''); this.resumen.set(null); this.ver.set(null);
    this.service.consultar(idDepartamento, anio, mes).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      next: r => { this.resumen.set(r); this.preparar(r); },
      error: e => this.error.set(errorDepartamento(e)),
    });
  }
  private preparar(r: ResumenCincoS) {
    const numero = r.inspecciones.some(i => i.numero === 1) ? 2 : 1;
    const periodo = r.anio + '-' + String(r.mes).padStart(2, '0');
    const hoy = hoyGuatemala();
    this.form.reset({ numero, fecha: hoy.startsWith(periodo) ? hoy : periodo + '-01', sucursal: '', encargado: '', observaciones: '', puntos: Array(20).fill(null) });
    this.valores.set(Array(20).fill(null));
    this.form.markAsPristine();
  }
  private mensajeActualizacion(r: { evaluacionesActualizadas?: number; evaluacionesCreadas?: number; empleadosSinDatos?: number[] }) {
    return 'KPI: ' + (r.evaluacionesActualizadas ?? 0) + ' evaluaciones actualizadas, ' + (r.evaluacionesCreadas ?? 0) + ' creadas. ' +
      ((r.empleadosSinDatos?.length ?? 0) ? r.empleadosSinDatos!.length + ' empleados sin métricas operativas en este mes.' : '');
  }
  recalcular() {
    const r = this.resumen();
    if (!r?.completo || this.saving() || this.loading()) return;
    this.saving.set(true); this.error.set(''); this.aviso.set('');
    this.service.recalcular(r.idDepartamento, r.anio, r.mes).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: resultado => { this.resumen.set(resultado.resumen); this.aviso.set(this.mensajeActualizacion(resultado)); },
      error: e => this.error.set(errorDepartamento(e)),
    });
  }
  guardar() {
    const r = this.resumen();
    if (!r || r.completo || this.loading() || this.saving()) return;
    this.form.markAllAsTouched(); this.error.set(''); this.aviso.set('');
    if (this.form.invalid) { this.error.set('Complete los datos y califique los 20 criterios. Cero es una calificación válida.'); return; }
    const v = this.form.getRawValue();
    const periodo = r.anio + '-' + String(r.mes).padStart(2, '0');
    if (!v.fecha.startsWith(periodo + '-') || !v.sucursal.trim() || !v.encargado.trim()) {
      this.error.set('La fecha debe pertenecer al mes consultado. Complete sucursal y encargado.'); return;
    }
    this.saving.set(true);
    this.service.guardar({ ...v, idDepartamento: r.idDepartamento, puntos: v.puntos as number[] }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: actualizado => {
        this.resumen.set(actualizado); this.preparar(actualizado);
        this.aviso.set(actualizado.completo ? this.mensajeActualizacion(actualizado) : 'Inspección registrada. Falta una inspección para completar el aporte mensual.');
      },
      error: e => this.error.set(errorDepartamento(e)),
    });
  }
}
