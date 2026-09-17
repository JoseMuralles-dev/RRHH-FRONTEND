import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/config/apis';
import { Rol } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<Rol[]>(`${API.baseUrl}${API.roles.base}`);
  }
}
