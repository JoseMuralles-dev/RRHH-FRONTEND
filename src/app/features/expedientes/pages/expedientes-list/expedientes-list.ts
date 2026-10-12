import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, finalize, from, map, mergeMap, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { EmpleadoOpcion } from '../../../empleados/models/empleado.model';
import { EmpleadoService, mensajeError } from '../../../empleados/services/empleado.service';
import { ExpedienteService } from '../../services/expediente.service';
@Component({ selector: 'app-expedientes-list', imports: [RouterLink, ReactiveFormsModule], templateUrl: './expedientes-list.html', styleUrl: './expedientes-list.css' })
export class ExpedientesList {
  private readonly empleadosService = inject(EmpleadoService);
  private readonly service = inject(ExpedienteService);
  private readonly destroyRef = inject(DestroyRef);
  readonly administrar = inject(AuthService).getNivelJerarquico() >= 3;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly empleados = signal<EmpleadoOpcion[]>([]);
  readonly estados = signal<Record<number, string>>({});
  readonly busqueda = new FormControl('', { nonNullable: true });
  readonly texto = signal(''); readonly pagina = signal(1);
  readonly filtrados = computed(() => this.empleados().filter(e => (e.nombreCompleto + ' ' + e.idEmpleado).toLocaleLowerCase().includes(this.texto().toLocaleLowerCase())));
  readonly visibles = computed(() => this.filtrados().slice((this.pagina() - 1) * 12, this.pagina() * 12));
  private consultas?: Subscription;
  constructor() { if (this.administrar) this.cargar(); else this.error.set('Esta sección está disponible para RRHH y administración.'); }
  cargar() {
    if (this.loading() || !this.administrar) return;
    this.consultas?.unsubscribe(); this.loading.set(true); this.error.set(''); this.empleados.set([]); this.estados.set({});
    this.empleadosService.select().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({ next: empleados => { this.empleados.set(empleados); this.pagina.set(1); this.consultarEstados(); }, error: e => this.error.set(mensajeError(e)) });
  }
  buscar() { this.texto.set(this.busqueda.value.trim()); this.pagina.set(1); this.consultarEstados(); }
  paginar(paso: number) { const next = this.pagina() + paso; if (next < 1 || (next - 1) * 12 >= this.filtrados().length) return; this.pagina.set(next); this.consultarEstados(); }
  private consultarEstados() {
    this.consultas?.unsubscribe(); this.estados.set({});
    this.consultas = from(this.visibles()).pipe(mergeMap(e => this.service.obtenerExpedienteEmpleado(e.idEmpleado).pipe(
      map(() => ({ id: e.idEmpleado, estado: 'Con expediente' })),
      catchError((error: unknown) => of({ id: e.idEmpleado, estado: error instanceof HttpErrorResponse && error.status === 404 ? 'Sin expediente activo' : 'No se pudo verificar' })),
    ), 3), takeUntilDestroyed(this.destroyRef)).subscribe(r => this.estados.update(estados => ({ ...estados, [r.id]: r.estado })));
  }
}
