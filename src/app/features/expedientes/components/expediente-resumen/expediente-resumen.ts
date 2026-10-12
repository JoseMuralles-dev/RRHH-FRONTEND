import { Component, input } from '@angular/core';
@Component({ selector: 'app-expediente-resumen', imports: [], templateUrl: './expediente-resumen.html', styleUrl: './expediente-resumen.css' })
export class ExpedienteResumen {
  readonly totalDocumentos = input(0);
  readonly totalObligatorios = input<number | null>(null);
  readonly obligatoriosCompletos = input(0);
  readonly proximosAVencer = input(0);
  readonly vencidos = input(0);
}
