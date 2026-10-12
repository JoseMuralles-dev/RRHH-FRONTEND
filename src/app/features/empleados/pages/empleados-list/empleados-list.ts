import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, map, merge, of, startWith, Subject, Subscription, switchMap, timer } from 'rxjs';
import { EmpleadoPerfil } from '../../components/empleado-perfil/empleado-perfil';
import { AuthService } from '../../../../core/services/auth';
import { Empleado, nombreCompleto } from '../../models/empleado.model';
import { EmpleadoService, mensajeError } from '../../services/empleado.service';

@Component({
  selector: 'app-empleados-list', imports: [RouterLink, ReactiveFormsModule, EmpleadoPerfil],
  templateUrl: './empleados-list.html', styleUrl: './empleados-list.css',
})
export class EmpleadosList {
  private readonly service = inject(EmpleadoService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly recargar = new Subject<void>();
  readonly busqueda = new FormControl('', { nonNullable: true });
  readonly empleados = signal<Empleado[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly aviso = signal('');
  readonly desactivando = signal<number | null>(null);
  readonly nombre = nombreCompleto;
  readonly seleccionado = signal<number | null>(null);
  readonly perfil = signal<Empleado | null>(null);
  readonly cargandoPerfil = signal(false);
  readonly errorPerfil = signal('');
  private consultaPerfil?: Subscription;
  iniciales(e: Empleado) { return ((e.primerNombre?.[0] ?? '') + (e.primerApellido?.[0] ?? '')).toUpperCase(); }

  seleccionar(empleado: Empleado) {
    if (this.seleccionado() === empleado.idEmpleado && !this.errorPerfil()) return;
    this.cargarPerfil(empleado.idEmpleado);
  }
  reintentarPerfil() {
    const id = this.seleccionado();
    if (id !== null) this.cargarPerfil(id);
  }
  private limpiarPerfil() {
    this.consultaPerfil?.unsubscribe();
    this.seleccionado.set(null); this.perfil.set(null);
    this.errorPerfil.set(''); this.cargandoPerfil.set(false);
  }
  private cargarPerfil(id: number) {
    this.consultaPerfil?.unsubscribe();
    this.seleccionado.set(id); this.perfil.set(null);
    this.errorPerfil.set(''); this.cargandoPerfil.set(true);
    this.consultaPerfil = this.service.obtener(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: empleado => { this.perfil.set(empleado); this.cargandoPerfil.set(false); },
      error: error => { this.errorPerfil.set(mensajeError(error)); this.cargandoPerfil.set(false); },
    });
  }
  get puedeEditar() { return this.auth.getNivelJerarquico() >= 3; }

  constructor() {
    merge(
      this.busqueda.valueChanges.pipe(map(texto => ({ texto: texto.trim(), delay: 300 }))),
      this.recargar.pipe(map(() => ({ texto: this.busqueda.value.trim(), delay: 0 }))),
    ).pipe(
      startWith({ texto: '', delay: 0 }),
      // Switch immediately on each keystroke, cancelling even requests already in flight.
      switchMap(({ texto, delay }) => {
        this.loading.set(true);
        this.error.set('');
        return timer(texto ? delay : 0).pipe(
          switchMap(() => texto ? this.service.buscar(texto) : this.service.listar()),
          map(empleados => ({ empleados, error: '' })),
          catchError(error => of({ empleados: [] as Empleado[], error: mensajeError(error) })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(result => {
      if (!result.empleados.some(e => e.idEmpleado === this.seleccionado())) this.limpiarPerfil();
      this.empleados.set(result.empleados);
      this.error.set(result.error);
      this.loading.set(false);
    });
  }

  reintentar() { this.recargar.next(); }

  desactivar(empleado: Empleado) {
    if (!this.puedeEditar || this.desactivando() !== null) return;
    if (!window.confirm(`¿Desactivar a ${this.nombre(empleado)}? Dejará de aparecer en empleados activos. No hay reactivación disponible. Su usuario asociado seguirá activo.`)) return;
    this.desactivando.set(empleado.idEmpleado);
    this.error.set('');
    this.aviso.set('');
    this.service.desactivar(empleado.idEmpleado).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.seleccionado() === empleado.idEmpleado) this.limpiarPerfil();
        this.desactivando.set(null);
        this.aviso.set('Empleado desactivado. Su usuario asociado no fue modificado.');
        this.recargar.next();
      },
      error: error => { this.desactivando.set(null); this.error.set(mensajeError(error)); },
    });
  }
}
