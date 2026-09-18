import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../../../core/config/apis';

import {
  Usuario,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  CambiarPasswordRequest
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly apiUrl =
    `${API.baseUrl}${API.usuarios.base}`;

  constructor(
    private http: HttpClient
  ) {}

  getAll(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      this.apiUrl
    );

  }

  getById(
    id: number
  ): Observable<Usuario> {

    return this.http.get<Usuario>(
      `${API.baseUrl}${API.usuarios.byId(id)}`
    );

  }

  create(
    data: CrearUsuarioRequest
  ): Observable<Usuario> {

    return this.http.post<Usuario>(
      this.apiUrl,
      data
    );

  }

  update(
    id: number,
    data: ActualizarUsuarioRequest
  ): Observable<Usuario> {

    return this.http.patch<Usuario>(
      `${API.baseUrl}${API.usuarios.byId(id)}`,
      data
    );

  }

  changePassword(
    id: number,
    data: CambiarPasswordRequest
  ): Observable<void> {

    return this.http.patch<void>(
      `${API.baseUrl}${API.usuarios.cambiarPassword(id)}`,
      data
    );

  }

  deactivate(
    id: number
  ): Observable<void> {

    return this.http.patch<void>(
      `${API.baseUrl}${API.usuarios.deactivate(id)}`,
      {}
    );

  }

}
