import { TestBed } from '@angular/core/testing';
import { FichaDesempeno } from './ficha-desempeno';
import { KpiDashboardResponse } from '../../models/dashboard-kpi.model';
describe('Ficha personal de desempeño', () => {
  function abrir(valores: (number | null)[]) {
    const dashboard = {
      idEmpleado: 60, empleado: { nombre: 'Oscar Daniel', departamento: 'Bodega' }, diasConDatos: 21,
      evaluaciones: [{ notaFinal: 65.10, puntajeBase: 65.10, estado: 'CALCULADA',
        resultados: valores.map((v, i) => ({ idMetrica: i, porcentajeCumplimiento: v })) }],
    } as KpiDashboardResponse;
    const f = TestBed.createComponent(FichaDesempeno); f.componentRef.setInput('dashboard', dashboard); f.detectChanges(); return f;
  }
  it('muestra porcentaje independiente de la nota, nombre y datos parciales', () => {
    const f = abrir([92.88, null]);
    expect(f.nativeElement.querySelector('svg text').textContent).toContain('92.88%');
    expect(f.nativeElement.textContent).toContain('Datos parciales');
    expect(f.nativeElement.textContent).toContain('65.10');
    expect(f.nativeElement.textContent).toContain('Oscar Daniel');
    expect(f.nativeElement.textContent).toContain('21 días');
  });
  it('no convierte datos ausentes en cero', () => {
    const f = abrir([null]);
    expect(f.nativeElement.querySelector('svg text').textContent).toBe('—');
    expect(f.nativeElement.querySelector('.avance')).toBeNull();
  });
  it('conserva cero y porcentajes mayores de cien, limitando solo el arco', () => {
    const f = abrir([0, 240]);
    expect(f.nativeElement.querySelector('svg text').textContent).toContain('120%');
    expect(f.nativeElement.querySelector('.avance').getAttribute('stroke-dasharray')).toBe('100 100');
  });
  it('emite ver detalle sin usar un enlace que cambie la ruta', () => {
    const f = abrir([80]);
    const listener = vi.fn();
    f.componentInstance.verDetalle.subscribe(listener);
    f.nativeElement.querySelector('button').click();
    expect(listener).toHaveBeenCalledOnce();
    expect(f.nativeElement.querySelector('a[href]')).toBeNull();
  });
});