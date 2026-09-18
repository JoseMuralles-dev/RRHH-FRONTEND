import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:3000/auth';

  constructor(
    private http: HttpClient
  ) {}

  login(data: LoginRequest): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        data
      )
      .pipe(
        tap(response => {

          localStorage.setItem(
            'access_token',
            response.access_token
          );

        })
      );
  }

  logout(): void {

    localStorage.removeItem('access_token');

  }

  getToken(): string | null {

    return localStorage.getItem('access_token');

  }

  isAuthenticated(): boolean {

    return !!this.getToken();

  }

  getNivelJerarquico(): number {
    try {
      const segment = this.getToken()?.split('.')[1];
      if (!segment) return 0;
      const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return 0;
      return typeof payload.nivelJerarquico === 'number' ? payload.nivelJerarquico : 0;
    } catch {
      return 0;
    }
  }

  getUsuarioSesion(): { idUsuario: number; idEmpleado: number | null; nivelJerarquico: number } | null {
    try {
      const segment = this.getToken()?.split('.')[1];
      if (!segment) return null;
      const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      if (!Number.isSafeInteger(payload.sub) || payload.sub <= 0
        || (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now())) return null;
      return {
        idUsuario: payload.sub,
        idEmpleado: Number.isSafeInteger(payload.idEmpleado) && payload.idEmpleado > 0 ? payload.idEmpleado : null,
        nivelJerarquico: typeof payload.nivelJerarquico === 'number' ? payload.nivelJerarquico : 0,
      };
    } catch {
      return null;
    }
  }

}
