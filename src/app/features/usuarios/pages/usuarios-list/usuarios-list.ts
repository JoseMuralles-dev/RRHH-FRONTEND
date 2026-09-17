import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  UsuarioService
} from '../../services/usuario.service';

import {
  Usuario
} from '../../models/usuario.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.css'
})
export class UsuariosList
  implements OnInit {

  readonly usuarios = signal<Usuario[]>([]);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  constructor(
    private usuarioService:
      UsuarioService
  ) {}

  ngOnInit(): void {

    this.cargarUsuarios();

  }

  cargarUsuarios(): void {

    this.loading.set(true);
    this.errorMessage.set('');

    this.usuarioService
      .getAll()
      .subscribe({

        next: (usuarios) => {

          this.usuarios.set(usuarios);

          this.loading.set(false);

        },

        error: (error) => {

          console.error(
            'Error cargando usuarios:',
            error
          );

          this.errorMessage.set(
            'No se pudieron cargar los usuarios.'
          );

          this.loading.set(false);

        }

      });

  }

  desactivarUsuario(
    usuario: Usuario
  ): void {

    const confirmar =
      confirm(
        `¿Desea desactivar al usuario ${usuario.correo}?`
      );

    if (!confirmar) {
      return;
    }

    this.usuarioService
      .deactivate(
        usuario.idUsuario
      )
      .subscribe({

        next: () => {
          this.cargarUsuarios();
        },

        error: (error) => {

          console.error(error);

          alert(
            'No se pudo desactivar el usuario.'
          );

        }

      });

  }

}
