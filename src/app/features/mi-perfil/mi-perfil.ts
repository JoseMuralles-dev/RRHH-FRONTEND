import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { API } from '../../core/config/apis';
import { Empleado } from '../empleados/models/empleado.model';
import { EmpleadoPerfil } from '../empleados/components/empleado-perfil/empleado-perfil';
@Component({
  selector: 'app-mi-perfil', imports: [RouterLink, EmpleadoPerfil],
  template: `
    <section class="perfil">
      <header><div><h1>Mi perfil</h1><p>Consulta tus datos personales, laborales y documentos.</p></div>
        @if (perfil()?.empleado) { <a routerLink="/expedientes/mi-expediente">Ver mi expediente</a> }
      </header>
      @if (cargando()) { <p role="status">Cargando tu perfil...</p> }
      @else if (error()) { <div role="alert"><p>{{ error() }}</p><button (click)="cargar()">Reintentar</button></div> }
      @else if (perfil(); as p) {
        <p>Usuario: {{ p.correo }}</p>
        @if (p.empleado; as empleado) { <app-empleado-perfil [empleado]="empleado" [propio]="true" /> }
        @else { <p>Tu usuario no tiene un empleado asociado. Solicita a Recursos Humanos que vincule tu cuenta para consultar tus datos y expediente.</p> }
      }
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .perfil { width: 100%; max-width: 1200px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    h1 { margin-bottom: 8px; } p { color: var(--text-secondary); line-height: 1.6; }
    a, button { background: var(--sidebar-bg); color: var(--text-inverse); padding: 12px 18px; border: 0; border-radius: 8px; text-decoration: none; cursor: pointer; font: inherit; }
  `],
})
export class MiPerfil {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly perfil = signal<{ correo: string; empleado: Empleado | null } | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  constructor() { this.cargar(); }
  cargar() {
    if (this.cargando()) return;
    this.cargando.set(true); this.error.set('');
    this.http.get<{ correo: string; empleado: Empleado | null }>(API.baseUrl + '/auth/mi-perfil')
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
      .subscribe({ next: p => this.perfil.set(p), error: () => this.error.set('No se pudo cargar tu perfil. Intenta nuevamente.') });
  }
}
