import { Component, DestroyRef, inject, signal, input, output } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { API } from '../../core/config/apis';
import { CampanaNotificacionesComponent } from '../../features/notificaciones/components/campana-notificaciones/campana-notificaciones.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CampanaNotificacionesComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly nombre = signal('Cargando usuario…');

  constructor() {
    this.http.get<{ nombre: string; correo: string }>(API.baseUrl + '/auth/me')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: perfil => this.nombre.set(perfil.nombre || perfil.correo),
        error: (error: HttpErrorResponse) => {
          this.nombre.set('No se pudo cargar el usuario');
          if (error.status === 401) this.logout();
        },
      });
  }
  logout(): void {
    this.nombre.set('');
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
