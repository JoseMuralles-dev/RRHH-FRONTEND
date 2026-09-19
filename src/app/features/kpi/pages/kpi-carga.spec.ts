import { provideZonelessChangeDetection, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { KpiService } from '../services/kpi.service';
import { KpiDashboard } from './kpi-dashboard/kpi-dashboard';
import { KpiEquipo } from './kpi-equipo/kpi-equipo';

const dashboard = {
  idEmpleado: 22, periodo: { anio: 2026, mes: 8, fechaInicial: '2026-08-01', fechaFinal: '2026-08-31' },
  tieneDatos: false, ultimaCargaDiaria: null, diasConDatos: 0, evaluaciones: [], seriesDiarias: [],
};
const equipo = { idEncargado: 1, periodo: { anio: 2026, mes: 8 }, totalSubordinados: 0, empleados: [] };

for (const caso of [
  { nombre: 'personal', componente: KpiDashboard as Type<any>, metodo: 'getMiDashboard', respuesta: dashboard },
  { nombre: 'equipo', componente: KpiEquipo as Type<any>, metodo: 'getMiEquipo', respuesta: equipo },
]) {
  describe('Actualización automática KPI ' + caso.nombre, () => {
    let respuestas: Subject<any>[];
    beforeEach(() => {
      respuestas = [];
      const consultar = () => { const respuesta = new Subject<any>(); respuestas.push(respuesta); return respuesta.asObservable(); };
      TestBed.configureTestingModule({
        imports: [caso.componente],
        providers: [provideZonelessChangeDetection(), { provide: KpiService, useValue: { [caso.metodo]: consultar } }],
      });
    });
    it('actualiza el DOM al recibir datos sin clic ni detectChanges manual', async () => {
      const fixture = TestBed.createComponent(caso.componente);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('Cargando');
      await Promise.resolve();
      respuestas[0].next(caso.respuesta);
      respuestas[0].complete();
      await fixture.whenStable();
      expect(fixture.componentInstance.loading).toBe(false);
      expect(fixture.nativeElement.textContent).not.toContain('Cargando');
      expect(fixture.nativeElement.querySelector('.state-card')).not.toBeNull();
    });
    it('muestra el error y apaga la carga automáticamente', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const fixture = TestBed.createComponent(caso.componente);
      await fixture.whenStable();
      respuestas[0].error({ status: 403, error: { message: 'Sin permiso de prueba' } });
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('Sin permiso de prueba');
      expect(fixture.nativeElement.textContent).not.toContain('Cargando');
      vi.restoreAllMocks();
    });
    it('cancela consultas anteriores y libera las suscripciones al salir', async () => {
      const fixture = TestBed.createComponent(caso.componente);
      await fixture.whenStable();
      fixture.componentInstance.periodoForm.patchValue({ mes: 8 });
      expect(respuestas[0].observed).toBe(false);
      expect(respuestas[1].observed).toBe(true);
      fixture.destroy();
      expect(respuestas[1].observed).toBe(false);
      fixture.componentInstance.periodoForm.patchValue({ mes: 7 });
      expect(respuestas.length).toBe(2);
    });
  });
}