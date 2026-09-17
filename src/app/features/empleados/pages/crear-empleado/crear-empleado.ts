import { Component } from '@angular/core';
import { EmpleadoForm } from '../../components/empleado-form/empleado-form';

@Component({
  selector: 'app-crear-empleado',
  standalone: true,
  imports: [EmpleadoForm],
  templateUrl: './crear-empleado.html',
  styleUrl: './crear-empleado.css',
})
export class CrearEmpleado {}
