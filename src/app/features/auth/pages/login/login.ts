import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  readonly loading = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorMessage = signal('');

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

    if (this.loading()) return;

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.loginForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({

        next: () => {

          this.loading.set(false);

          this.router.navigate([
            '/dashboard'
          ]);

        },

        error: (error: unknown) => {



          this.loading.set(false);

          this.errorMessage.set(error instanceof HttpErrorResponse
            ? error.status === 0
              ? 'No se pudo conectar con el servidor. Intenta nuevamente.'
              : error.status === 401
                ? 'Usuario o contraseña inválidos.'
                : error.status === 400
                  ? 'Revisa el correo y la contraseña ingresados.'
                  : 'No se pudo iniciar sesión. Intenta nuevamente más tarde.'
            : 'Ocurrió un error inesperado al iniciar sesión.');

        }

      });

  }

}

