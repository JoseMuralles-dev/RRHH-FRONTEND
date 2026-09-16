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

}