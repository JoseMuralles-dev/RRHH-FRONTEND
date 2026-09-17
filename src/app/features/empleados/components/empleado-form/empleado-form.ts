import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { cambiosEmpleado, datosFormulario, EmpleadoDatos, EmpleadoOpcion } from '../../models/empleado.model';
import { EmpleadoService, mensajeError } from '../../services/empleado.service';

const entero: ValidatorFn = control => control.value == null || Number.isSafeInteger(control.value)
  ? null : { entero: true };
const noBlanco: ValidatorFn = control => typeof control.value === 'string' && control.value.trim()
  ? null : { required: true };
const fecha = [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)];

@Component({
  selector: 'app-empleado-form', imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './empleado-form.html', styleUrl: './empleado-form.css',
})
export class EmpleadoForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EmpleadoService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private original: EmpleadoDatos | null = null;
  readonly id = this.route.snapshot.paramMap.get('id') === null ? null : Number(this.route.snapshot.paramMap.get('id'));
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loaded = signal(this.id === null);
  readonly error = signal('');
  readonly loadingJefes = signal(false);
  readonly errorJefes = signal('');
  readonly jefes = signal<EmpleadoOpcion[]>([]);
  get puedeEditar() { return this.auth.getNivelJerarquico() >= 3; }

  readonly form = this.fb.group({
    idPuesto: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), entero]),
    idJefeDirecto: this.fb.control<number | null>(null, [Validators.min(1), entero,
      control => this.id !== null && control.value === this.id ? { propioJefe: true } : null]),
    codigoSapEmpleado: this.fb.control<number | null>(null, entero),
    primerNombre: this.fb.nonNullable.control('', [noBlanco, Validators.maxLength(50)]),
    segundoNombre: this.fb.nonNullable.control('', Validators.maxLength(50)),
    primerApellido: this.fb.nonNullable.control('', [noBlanco, Validators.maxLength(50)]),
    segundoApellido: this.fb.nonNullable.control('', Validators.maxLength(50)),
    dpi: this.fb.nonNullable.control('', [noBlanco, Validators.maxLength(13)]),
    igss: this.fb.nonNullable.control('', [noBlanco, Validators.maxLength(20)]),
    fechaNacimiento: this.fb.nonNullable.control('', fecha),
    fechaIngreso: this.fb.nonNullable.control('', fecha),
    sueldoActual: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^[+-]?(?:\d+|\d*\.\d+)$/)]),
    telefono: this.fb.nonNullable.control('', Validators.maxLength(20)),
    direccion: this.fb.nonNullable.control(''),
  });

  readonly campos: { key: keyof EmpleadoDatos; label: string; type: string; required: boolean; max?: number }[] = [
    { key: 'primerNombre', label: 'Primer nombre', type: 'text', required: true, max: 50 },
    { key: 'segundoNombre', label: 'Segundo nombre', type: 'text', required: false, max: 50 },
    { key: 'primerApellido', label: 'Primer apellido', type: 'text', required: true, max: 50 },
    { key: 'segundoApellido', label: 'Segundo apellido', type: 'text', required: false, max: 50 },
    { key: 'dpi', label: 'DPI', type: 'text', required: true, max: 13 },
    { key: 'igss', label: 'IGSS', type: 'text', required: true, max: 20 },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true },
    { key: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date', required: true },
    { key: 'sueldoActual', label: 'Sueldo actual', type: 'text', required: true },
    { key: 'telefono', label: 'Teléfono', type: 'text', required: false, max: 20 },
  ];

  ngOnInit() {
    this.cargarJefes();
    if (this.id !== null) this.cargarEmpleado();
  }

  cargarJefes() {
    if (this.loadingJefes()) return;
    this.loadingJefes.set(true);
    this.errorJefes.set('');
    this.service.select().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: jefes => {
        this.jefes.set(jefes.filter(jefe => jefe.idEmpleado !== this.id));
        this.loadingJefes.set(false);
      },
      error: error => { this.errorJefes.set(mensajeError(error)); this.loadingJefes.set(false); },
    });
  }

  cargarEmpleado() {
    if (this.id === null || !Number.isSafeInteger(this.id) || this.id <= 0) {
      this.error.set('El ID del empleado no es válido.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.service.obtener(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: empleado => {
        this.original = datosFormulario(empleado);
        this.form.patchValue({ ...this.original,
          segundoNombre: this.original.segundoNombre ?? '',
          segundoApellido: this.original.segundoApellido ?? '',
          telefono: this.original.telefono ?? '', direccion: this.original.direccion ?? '',
        });
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: error => { this.error.set(mensajeError(error)); this.loading.set(false); },
    });
  }

  errorCampo(control: AbstractControl): string {
    if (!control.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('propioJefe')) return 'El empleado no puede ser su propio jefe.';
    if (control.hasError('min')) return 'Ingresa un entero positivo.';
    if (control.hasError('entero')) return 'Ingresa un número entero válido.';
    return 'Revisa el formato de este campo.';
  }

  jefeNoDisponible(): boolean {
    const id = this.form.controls.idJefeDirecto.value;
    return id !== null && !this.jefes().some(jefe => jefe.idEmpleado === id);
  }

  guardar() {
    if (this.saving() || !this.loaded() || !this.puedeEditar) return;
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.error.set('Revisa los campos indicados.'); return; }
    const values = this.form.getRawValue();
    const data = datosFormulario({ ...values, idPuesto: values.idPuesto! });
    const cambios = this.original ? cambiosEmpleado(this.original, data) : data;
    if (!Object.keys(cambios).length) { this.error.set('No hay cambios para guardar.'); return; }
    this.saving.set(true);
    const request = this.id === null ? this.service.crear(data) : this.service.actualizar(this.id, cambios);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void this.router.navigate(['/empleados']); },
      error: error => { this.saving.set(false); this.error.set(mensajeError(error)); },
    });
  }
}
