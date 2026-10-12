import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, combineLatest, finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { SubirDocumentoPayload, TipoDocumentoExpediente } from '../../models/expediente.model';
import { ExpedienteService, errorExpediente } from '../../services/expediente.service';
import { fechaCalendario, tamanoArchivo, validarArchivo } from '../../utils/documento-utils';
@Component({ selector: 'app-subir-documento', imports: [ReactiveFormsModule, RouterLink], templateUrl: './subir-documento.html', styleUrl: './subir-documento.css' })
export class SubirDocumento {
  private readonly service = inject(ExpedienteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  readonly administrar = inject(AuthService).getNivelJerarquico() >= 3;
  readonly loading = signal(false); readonly saving = signal(false); readonly verificado = signal(false);
  readonly error = signal(''); readonly errorArchivo = signal(''); readonly success = signal('');
  readonly tipos = signal<TipoDocumentoExpediente[]>([]); readonly archivo = signal<File | null>(null);
  readonly requiereVencimiento = signal(false);
  readonly tamano = tamanoArchivo;
  idExpediente = 0; idEmpleado = 0;
  readonly form = this.fb.group({ idTipoDocumento: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    fechaDocumento: this.fb.nonNullable.control(''), fechaVencimiento: this.fb.nonNullable.control(''), observaciones: this.fb.nonNullable.control('', Validators.maxLength(5000)) });
  constructor() {
    this.form.controls.idTipoDocumento.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      const requiere = this.tipos().find(t => t.idTipoDocumento === id)?.requiereVencimiento === true;
      this.requiereVencimiento.set(requiere); this.form.controls.fechaVencimiento.setValidators(requiere ? [Validators.required] : []); this.form.controls.fechaVencimiento.updateValueAndValidity();
    });
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([params, query]) => {
      this.idExpediente = Number(params.get('idExpediente')); this.idEmpleado = Number(query.get('idEmpleado'));
      this.archivo.set(null); this.form.reset(); this.cargar();
    });
  }
  cargar() {
    if (this.saving()) return;
    this.consulta?.unsubscribe(); this.error.set(''); this.verificado.set(false); this.tipos.set([]);
    if (!this.administrar) { this.error.set('Solo RRHH o administración pueden cargar documentos.'); return; }
    if (![this.idExpediente, this.idEmpleado].every(id => Number.isSafeInteger(id) && id > 0)) { this.error.set('Abre la opción Subir documento desde el detalle del empleado.'); return; }
    this.loading.set(true);
    this.consulta = forkJoin({ tipos: this.service.listarTiposDocumento(), expediente: this.service.obtenerExpedienteEmpleado(this.idEmpleado) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({ next: ({ tipos, expediente }) => {
        if (expediente.idExpediente !== this.idExpediente || expediente.idEmpleado !== this.idEmpleado || !expediente.isActive) { this.error.set('El expediente no corresponde al empleado seleccionado o está inactivo.'); return; }
        this.tipos.set(tipos.filter(t => t.isActive)); this.verificado.set(true);
      }, error: e => this.error.set(errorExpediente(e)) });
  }
  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement; const file = input.files?.[0] ?? null;
    this.archivo.set(null); this.errorArchivo.set('');
    if (!file) return;
    const error = validarArchivo(file);
    if (error) { this.errorArchivo.set(error); input.value = ''; } else this.archivo.set(file);
  }
  guardar() {
    if (!this.administrar || !this.verificado() || this.loading() || this.saving()) return;
    this.form.markAllAsTouched(); this.error.set(''); const datos = this.form.getRawValue(), file = this.archivo();
    const tipo = this.tipos().find(t => t.idTipoDocumento === datos.idTipoDocumento);
    if (!file) { this.errorArchivo.set('Adjunta un archivo PDF, JPG o PNG.'); return; }
    const errorArchivo = validarArchivo(file); if (errorArchivo) { this.errorArchivo.set(errorArchivo); return; }
    if (this.form.invalid || !tipo || (tipo.requiereVencimiento && !datos.fechaVencimiento)
      || (datos.fechaDocumento && fechaCalendario(datos.fechaDocumento) === null) || (datos.fechaVencimiento && fechaCalendario(datos.fechaVencimiento) === null)) { this.error.set('Revisa los campos y las fechas del formulario.'); return; }
    const payload: SubirDocumentoPayload = { idTipoDocumento: tipo.idTipoDocumento,
      ...(datos.fechaDocumento ? { fechaDocumento: datos.fechaDocumento } : {}), ...(datos.fechaVencimiento ? { fechaVencimiento: datos.fechaVencimiento } : {}), ...(datos.observaciones.trim() ? { observaciones: datos.observaciones.trim() } : {}) };
    const empleadoDestino = this.idEmpleado;
    this.saving.set(true);
    this.service.subirDocumento(this.idExpediente, file, payload).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.archivo.set(null); this.verificado.set(false); this.success.set('Documento guardado correctamente.'); void this.router.navigate(['/expedientes/empleado', empleadoDestino]); },
      error: e => this.error.set(errorExpediente(e)),
    });
  }
}
