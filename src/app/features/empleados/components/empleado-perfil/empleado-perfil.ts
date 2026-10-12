import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Empleado, nombreCompleto } from '../../models/empleado.model';

@Component({
  selector: 'app-empleado-perfil',
  imports: [DatePipe, RouterLink],
  templateUrl: './empleado-perfil.html',
  styleUrl: './empleado-perfil.css',
})
export class EmpleadoPerfil {
  readonly empleado = input.required<Empleado>();
  readonly puedeEditar = input(false);
  readonly desactivando = input(false);
  readonly desactivar = output<Empleado>();
  readonly nombre = nombreCompleto;
  iniciales(e: Empleado) { return ((e.primerNombre?.[0] ?? '') + (e.primerApellido?.[0] ?? '')).toUpperCase(); }
}
