import { Component } from '@angular/core';
import { EmpleadoForm } from '../../components/empleado-form/empleado-form';

@Component({
  selector: 'app-actualizar-empleado',
  standalone: true,
  imports: [EmpleadoForm],
  templateUrl: './actualizar-empleado.html',
  styleUrl: './actualizar-empleado.css',
})
export class ActualizarEmpleado {}
