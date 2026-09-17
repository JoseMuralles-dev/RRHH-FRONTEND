import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { Empleado, nombreCompleto } from '../../models/empleado.model';
import { EmpleadoService, mensajeError } from '../../services/empleado.service';

@Component({
  selector: 'app-empleado-detalle', imports: [RouterLink],
  templateUrl: './empleado-detalle.html', styleUrl: './empleado-detalle.css',
})
export class EmpleadoDetalle implements OnInit {
  private readonly service = inject(EmpleadoService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly empleado = signal<Empleado | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly nombre = nombreCompleto;
  get puedeEditar() { return this.auth.getNivelJerarquico() >= 3; }
  ngOnInit() { this.cargar(); }

  cargar() {
    if (!Number.isSafeInteger(this.id) || this.id <= 0) {
      this.error.set('El ID del empleado no es válido.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.service.obtener(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: empleado => { this.empleado.set(empleado); this.loading.set(false); },
      error: error => { this.error.set(mensajeError(error)); this.loading.set(false); },
    });
  }
}
