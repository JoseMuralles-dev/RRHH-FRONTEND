import { Component, inject } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  UsuarioService
} from '../../services/usuario.service';

@Component({
  selector:
    'app-cambiar-password',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './cambiar-password.html',

  styleUrl:
    './cambiar-password.css'
})
export class CambiarPassword {

  private readonly fb = inject(FormBuilder);

  idUsuario!: number;

  loading = false;

  errorMessage = '';

  passwordForm =
    this.fb.group({

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],

      confirmarPassword: [
        '',
        Validators.required
      ]

    });

  constructor(
    private route:
      ActivatedRoute,

    private router:
      Router,

    private usuarioService:
      UsuarioService
  ) {

    this.idUsuario =
      Number(
        this.route
          .snapshot
          .paramMap
          .get('id')
      );

  }

  cambiarPassword(): void {

    if (
      this.passwordForm.invalid
    ) {

      this.passwordForm
        .markAllAsTouched();

      return;

    }

    const valores =
      this.passwordForm
        .getRawValue();

    if (
      valores.password !==
      valores.confirmarPassword
    ) {

      this.errorMessage =
        'Las contraseñas no coinciden.';

      return;

    }

    this.loading = true;

    this.errorMessage = '';

    this.usuarioService
      .changePassword(
        this.idUsuario,
        {
          password:
            valores.password!
        }
      )
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate([
            '/usuarios'
          ]);

        },

        error: (error) => {

          console.error(error);

          this.loading = false;

          this.errorMessage =
            error.error?.message
            || 'No se pudo cambiar la contraseña.';

        }

      });

  }

}
