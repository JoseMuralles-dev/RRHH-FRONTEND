import { EmpleadoService } from '../../../empleados/services/empleado.service';
import { EmpleadoOpcion } from '../../../empleados/models/empleado.model';
import { RolService } from '../../services/rol.service';
import { Rol } from '../../models/usuario.model';
import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {UsuarioService} from '../../services/usuario.service';
import {ActualizarUsuarioRequest} from '../../models/usuario.model';

@Component({
  selector: 'app-actualizar-usuario',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './actualizar-usuario.html',

  styleUrl:
    './actualizar-usuario.css'
})
export class ActualizarUsuario
  implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly empleadoService = inject(EmpleadoService);
  readonly empleados = signal<EmpleadoOpcion[]>([]);
  readonly loadingEmpleados = signal(true);
  readonly empleadosError = signal('');

  empleadoActualDisponible(): boolean {
    return this.empleados().some(empleado => empleado.idEmpleado === this.usuarioForm.controls.idEmpleado.value);
  }

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


  readonly usuarioLoaded = signal(false);

  idUsuario!: number;

  readonly loading = signal(false);

  readonly loadingUsuario = signal(true);

  readonly errorMessage = signal('');

  usuarioForm =
    this.fb.group({

      idEmpleado: [
        null as number | null
      ],

      idRol: [
        null as number | null,
        Validators.required
      ],

      correo: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      isActive: this.fb.nonNullable.control(true)

    });

  constructor(
    private route:
      ActivatedRoute,

    private router:
      Router,

    private usuarioService:
      UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarEmpleados();

    this.idUsuario =
      Number(
        this.route
          .snapshot
          .paramMap
          .get('id')
      );

    this.cargarUsuario();

  }

  cargarUsuario(): void {
    this.loadingUsuario.set(true);
    this.usuarioLoaded.set(false);
    this.errorMessage.set('');

    this.usuarioService
      .getById(
        this.idUsuario
      )
      .subscribe({

        next: (usuario) => {

          this.usuarioForm
            .patchValue({

              idEmpleado:
                usuario.idEmpleado ?? null,

              idRol:
                usuario.idRol,

              correo:
                usuario.correo,

              isActive:
                usuario.isActive

            });

          this.usuarioLoaded.set(true);
          this.loadingUsuario.set(false);

        },

        error: (error) => {

          console.error(error);

          this.errorMessage.set('No se pudo cargar el usuario.');
          this.loadingUsuario.set(false);

        }

      });

  }

  actualizarUsuario(): void {
    if (this.loadingEmpleados() || this.empleadosError() || this.loading() || this.loadingUsuario() || !this.usuarioLoaded() || this.loadingRoles() || this.rolesError() || !this.roles().length) return;

    if (
      this.usuarioForm.invalid
    ) {

      this.usuarioForm
        .markAllAsTouched();

      return;

    }

    const valores =
      this.usuarioForm
        .getRawValue();

    const data:
      ActualizarUsuarioRequest = {

      idEmpleado:
        valores.idEmpleado,

      idRol:
        valores.idRol!,

      correo:
        valores.correo!,

      isActive:
        valores.isActive

    };

    this.errorMessage.set('');
    this.loading.set(true);

    this.usuarioService
      .update(
        this.idUsuario,
        data
      )
      .subscribe({

        next: () => {

          this.loading.set(false);

          this.router.navigate([
            '/usuarios'
          ]);

        },

        error: (error) => {

          console.error(error);

          this.loading.set(false);

          this.errorMessage.set(error.error?.message
            || 'No se pudo actualizar el usuario.');

        }

      });

  }

}
