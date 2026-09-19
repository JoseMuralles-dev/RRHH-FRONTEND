import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { Departamento } from '../../models/departamento.model';
import { DepartamentoService, errorDepartamento } from '../../services/departamento.service';

@Component({
  selector: 'app-departamentos',
  imports: [ReactiveFormsModule],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css',
})
export class Departamentos implements OnInit {
  private readonly service = inject(DepartamentoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly departamentos = signal<Departamento[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly errorForm = signal('');
  readonly mensaje = signal('');
  readonly busqueda = signal('');
  readonly formularioAbierto = signal(false);
  readonly editando = signal<Departamento | null>(null);
  readonly pendienteDesactivar = signal<Departamento | null>(null);
  readonly filtrados = computed(() => this.departamentos().filter(d =>
    d.nombreDepartamento.toLocaleLowerCase().includes(this.busqueda().trim().toLocaleLowerCase())));
  readonly form = inject(FormBuilder).nonNullable.group({
    nombreDepartamento: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    descripcion: [''],
  });
  get puedeEditar() { return this.auth.getNivelJerarquico() >= 4; }
  ngOnInit() { this.cargar(); }
  cargar() {
    if (this.loading()) return;
    this.loading.set(true); this.error.set('');
    this.service.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: datos => { this.departamentos.set(datos); this.loading.set(false); },
      error: error => { this.error.set(errorDepartamento(error)); this.loading.set(false); },
    });
  }
  abrir(departamento: Departamento | null = null) {
    if (!this.puedeEditar || this.saving()) return;
    this.editando.set(departamento);
    this.form.reset({ nombreDepartamento: departamento?.nombreDepartamento ?? '', descripcion: departamento?.descripcion ?? '' });
    this.errorForm.set(''); this.mensaje.set(''); this.formularioAbierto.set(true);
  }
  cerrar() { if (!this.saving()) this.formularioAbierto.set(false); }
  guardar() {
    if (!this.puedeEditar || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const valor = this.form.getRawValue();
    const datos = { nombreDepartamento: valor.nombreDepartamento.trim(), descripcion: valor.descripcion.trim() };
    const actual = this.editando();
    this.saving.set(true); this.errorForm.set('');
    const consulta = actual ? this.service.actualizar(actual.idDepartamento, datos) : this.service.crear(datos);
    consulta.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.formularioAbierto.set(false); this.mensaje.set(actual ? 'Departamento actualizado.' : 'Departamento creado.'); this.cargar(); },
      error: error => { this.errorForm.set(errorDepartamento(error)); this.saving.set(false); },
    });
  }
  desactivar() {
    const actual = this.pendienteDesactivar();
    if (!actual || !this.puedeEditar || this.saving()) return;
    this.saving.set(true); this.error.set('');
    this.service.desactivar(actual.idDepartamento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.pendienteDesactivar.set(null); this.mensaje.set('Departamento desactivado.'); this.cargar(); },
      error: error => { this.error.set(errorDepartamento(error)); this.saving.set(false); this.pendienteDesactivar.set(null); },
    });
  }
  puestosActivos(departamento: Departamento) { return departamento.puestos?.filter(p => p.isActive).length ?? 0; }
}
