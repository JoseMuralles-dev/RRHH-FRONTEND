import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { API } from '../../core/config/apis';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
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