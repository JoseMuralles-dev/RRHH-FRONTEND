import { EmpleadoService } from '../../../empleados/services/empleado.service';
import { EmpleadoOpcion } from '../../../empleados/models/empleado.model';
import { RolService } from '../../services/rol.service';
import { Rol } from '../../models/usuario.model';
import { Component, inject, OnInit, signal } from '@angular/core';

import {FormBuilder,ReactiveFormsModule,Validators} from '@angular/forms';
import {Router,RouterLink} from '@angular/router';
import {UsuarioService} from '../../services/usuario.service';
import {CrearUsuarioRequest} from '../../models/usuario.model';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './crear-usuario.html',
  styleUrl: './crear-usuario.css'
})

export class CrearUsuario implements OnInit {

            private readonly fb = inject(FormBuilder);
  private readonly empleadoService = inject(EmpleadoService);
  readonly empleados = signal<EmpleadoOpcion[]>([]);
  readonly loadingEmpleados = signal(true);
  readonly empleadosError = signal('');

  cargarEmpleados(): void {
    this.loadingEmpleados.set(true);
    this.empleadosError.set('');
    this.empleadoService.select().subscribe({
      next: (empleados) => {
        this.empleados.set(empleados);
        this.loadingEmpleados.set(false);
      },
      error: () => {
        this.empleadosError.set('No se pudieron cargar los empleados.');
        this.loadingEmpleados.set(false);
      }
    });
  }
  private readonly rolService = inject(RolService);
  readonly roles = signal<Rol[]>([]);
  readonly loadingRoles = signal(true);
  readonly rolesError = signal('');

  cargarRoles(): void {
    this.loadingRoles.set(true);
    this.rolesError.set('');
    this.rolService.getAll().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loadingRoles.set(false);
      },
      error: () => {
        this.rolesError.set('No se pudieron cargar los roles.');
        this.loadingRoles.set(false);
      }
    });
  }


            readonly loading = signal(false);
            readonly errorMessage = signal('');
            usuarioForm = this.fb.group({

              correo: [
                '',
                [
                  Validators.required,
                  Validators.email
                ]
              ],

              password: [
                '',
                [
                  Validators.required,
                  Validators.minLength(8)
                ]
              ],

              confirmarPassword: [
                '',
                [
                  Validators.required
                ]
              ],

              idRol: [
                null as number | null,
                [
                  Validators.required
                ]
              ],

              idEmpleado: [
                null as number | null,
                [
                  Validators.required
                ]
              ]

            });

            constructor(
              private usuarioService: UsuarioService,
              private router: Router
            ) {}

            ngOnInit(): void {
              this.cargarRoles();
    this.cargarEmpleados();
            }

            crearUsuario(): void {

              if (this.loadingEmpleados() || this.empleadosError() || this.loading() || this.loadingRoles() || this.rolesError() || !this.roles().length) return;

              this.errorMessage.set('');

              if (this.usuarioForm.invalid) {
                this.usuarioForm.markAllAsTouched();
                this.errorMessage.set('Revisa los campos indicados antes de crear el usuario.');
                return;
              }

              const valores =
                this.usuarioForm.getRawValue();

              if (
                valores.password !==
                valores.confirmarPassword
              ) {
                this.errorMessage.set('Las contraseñas no coinciden.');

                return;
              }

              const data: CrearUsuarioRequest = {
                correo: valores.correo!,
                password: valores.password!,
                idRol: valores.idRol!,
                idEmpleado: valores.idEmpleado!
              };

              this.loading.set(true);

              this.usuarioService
                .create(data)
                .subscribe({

                  next: (response) => {

                    console.log(
                      'Usuario creado:',
                      response
                    );

                    this.loading.set(false);

                    this.router.navigate([
                      '/usuarios'
                    ]);

                  },

                  error: (error) => {

                    console.error(
                      'Error creando usuario:',
                      error
                    );

                    this.loading.set(false);

                    this.errorMessage.set(error.error?.message ||
                      'No se pudo crear el usuario.');

                  }

                });

            }

}
