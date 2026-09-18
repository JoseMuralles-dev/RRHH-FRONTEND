import { TestBed } from '@angular/core/testing';
import { SolicitudForm } from './solicitud-form';

describe('SolicitudForm', () => {
  function setup() {
    const fixture = TestBed.createComponent(SolicitudForm);
    fixture.componentRef.setInput('tipos', [{ idTipoIncidencia: 1, requierePeriodo: true, nombre: 'Permiso' }]);
    fixture.detectChanges();
    return fixture;
  }
  it('emits only the allowed DTO with numeric type and computed weekdays', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const emit = vi.fn(); component.enviar.subscribe(emit);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#tipo');
    select.selectedIndex = 1; select.dispatchEvent(new Event('change'));
    component.form.patchValue({ fechaInicio: '2026-09-18', fechaFin: '2026-09-21', motivo: ' Motivo personal ' });
    component.guardar();
    expect(emit).toHaveBeenCalledWith({ idTipoIncidencia: 1, fechaInicio: '2026-09-18', fechaFin: '2026-09-21', diasSolicitados: 2, motivo: 'Motivo personal' });
    fixture.componentRef.setInput('saving', true);
    component.guardar();
    expect(emit).toHaveBeenCalledTimes(1);
  });
  it('hides and omits the period when switching from vacation to materials', () => {
    const fixture = setup();
    fixture.componentRef.setInput('tipos', [
      { idTipoIncidencia: 1, nombre: 'Vacaciones', requierePeriodo: true },
      { idTipoIncidencia: 2, nombre: 'Materiales', requierePeriodo: false },
    ]);
    const component = fixture.componentInstance;
    const emit = vi.fn(); component.enviar.subscribe(emit);
    component.form.patchValue({ idTipoIncidencia: 1, fechaInicio: '2026-09-18', fechaFin: '2026-09-21', motivo: ' Materiales ' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#inicio')).not.toBeNull();
    component.form.patchValue({ idTipoIncidencia: 2 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#inicio')).toBeNull();
    component.guardar();
    expect(emit).toHaveBeenCalledWith({ idTipoIncidencia: 2, motivo: 'Materiales' });
    component.form.patchValue({ idTipoIncidencia: 1, fechaInicio: '', fechaFin: '' });
    component.guardar();
    expect(emit).toHaveBeenCalledTimes(1);
  });
  it('blocks weekend-only periods, whitespace reasons and unavailable types', () => {
    const fixture = setup(); const component = fixture.componentInstance;
    const emit = vi.fn(); component.enviar.subscribe(emit);
    component.form.patchValue({ idTipoIncidencia: 1, fechaInicio: '2026-09-19', fechaFin: '2026-09-20', motivo: 'Motivo' });
    component.guardar();
    component.form.patchValue({ fechaFin: '2026-09-21', motivo: '  ' }); component.guardar();
    component.form.patchValue({ idTipoIncidencia: 99, motivo: 'Motivo' }); component.guardar();
    expect(emit).not.toHaveBeenCalled();
  });
});
