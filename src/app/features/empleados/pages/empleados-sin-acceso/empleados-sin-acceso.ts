import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empleados-sin-acceso',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './empleados-sin-acceso.html',
  styleUrl: './empleados-sin-acceso.css',
})
export class EmpleadosSinAcceso {}
