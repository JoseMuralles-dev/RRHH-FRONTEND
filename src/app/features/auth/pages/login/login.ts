import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  loginForm: FormGroup;

  loading = false;

  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.loginForm = this.fb.group({

      correo: [
        '',
        [
          Validators.required
        ]
      ],

      password: [
        '',
        [
          Validators.required
        ]
      ]

    });

  }

  login(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .login(this.loginForm.value)
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate([
            '/dashboard'
          ]);

        },

        error: (error: unknown) => {



          this.loading = false;

          this.errorMessage = error instanceof HttpErrorResponse
            ? error.status === 0
              ? 'No se pudo conectar con el servidor. Revisa el túnel del backend y CORS.'
              : error.status === 401
                ? 'Acceso rechazado. Revisa tus credenciales y el acceso al túnel del backend.'
                : error.status === 400
                  ? 'Revisa el correo y la contraseña ingresados.'
                  : 'No se pudo iniciar sesión. Revisa la disponibilidad y el acceso al backend.'
            : 'Ocurrió un error inesperado al iniciar sesión.';

        }

      });

  }

}

