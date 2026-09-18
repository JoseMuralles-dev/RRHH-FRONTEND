import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrearSolicitudRequest, TipoIncidencia } from '../../models/solicitud.model';
import { diasLaborables } from '../../utils/solicitud-reglas';

@Component({
  selector: 'app-solicitud-form', imports: [ReactiveFormsModule],
  templateUrl: './solicitud-form.html', styleUrl: './solicitud-form.css',
})
export class SolicitudForm {
  private readonly fb = inject(FormBuilder);
  readonly tipos = input.required<TipoIncidencia[]>();
  readonly saving = input(false);
  readonly enviar = output<CrearSolicitudRequest>();
  readonly form = this.fb.group({
    idTipoIncidencia: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    fechaInicio: this.fb.nonNullable.control(''),
    fechaFin: this.fb.nonNullable.control(''),
    motivo: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]),
  });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly requierePeriodo = computed(() => this.tipos().find(t => t.idTipoIncidencia === this.valores().idTipoIncidencia)?.requierePeriodo === true);
  readonly dias = computed(() => diasLaborables(this.valores().fechaInicio ?? '', this.valores().fechaFin ?? ''));

  guardar() {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const tipo = this.tipos().find(t => t.idTipoIncidencia === value.idTipoIncidencia);
    const dias = tipo?.requierePeriodo ? diasLaborables(value.fechaInicio, value.fechaFin) : null;
    if (this.form.invalid || !tipo || (tipo.requierePeriodo && !dias)) return;
    this.enviar.emit({ idTipoIncidencia: tipo.idTipoIncidencia, motivo: value.motivo.trim(),
      ...(tipo.requierePeriodo ? { fechaInicio: value.fechaInicio, fechaFin: value.fechaFin, diasSolicitados: dias! } : {}) });
  }
}
