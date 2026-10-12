import { Component, input } from '@angular/core';
import { Departamento } from '../../models/departamento.model';

@Component({
  selector: 'app-organigrama',
  templateUrl: './organigrama.html',
  styleUrl: './organigrama.css',
})
export class Organigrama {
  readonly departamentos = input.required<Departamento[]>();
}
