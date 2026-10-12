import { TestBed } from '@angular/core/testing';
import { ExpedienteResumen } from './expediente-resumen';
describe('ExpedienteResumen', () => {
  it('distingue catálogo desconocido de cero tipos obligatorios', () => {
    const f = TestBed.createComponent(ExpedienteResumen); f.detectChanges(); expect(f.nativeElement.textContent).toContain('Sin información');
    f.componentRef.setInput('totalObligatorios', 0); f.detectChanges(); expect(f.nativeElement.textContent).toContain('0 / 0');
  });
});
