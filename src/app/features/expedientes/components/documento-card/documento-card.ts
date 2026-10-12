import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DocumentoExpediente } from '../../models/expediente.model';
import { etiquetaVencimiento, tamanoArchivo, vencimiento } from '../../utils/documento-utils';
@Component({ selector: 'app-documento-card', imports: [DatePipe], templateUrl: './documento-card.html', styleUrl: './documento-card.css' })
export class DocumentoCard {
  readonly documento = input.required<DocumentoExpediente>();
  readonly administrar = input(false);
  readonly disponiblePrevisualizacion = input(false);
  readonly previsualizar = output<DocumentoExpediente>();
  puedePrevisualizar() { return ['application/pdf', 'image/jpeg', 'image/png'].includes(this.documento().mimeType ?? ''); }
  readonly disponibleDescarga = input(false);
  readonly disponibleEdicion = input(false);
  readonly disponibleEliminar = input(false);
  readonly ocupado = input(false);
  readonly descargar = output<DocumentoExpediente>();
  readonly editar = output<DocumentoExpediente>();
  readonly eliminar = output<DocumentoExpediente>();
  readonly vencimiento = vencimiento;
  readonly etiqueta = etiquetaVencimiento;
  readonly tamano = tamanoArchivo;
}
