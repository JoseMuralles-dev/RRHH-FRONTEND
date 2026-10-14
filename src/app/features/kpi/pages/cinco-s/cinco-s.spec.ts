import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { CincoS } from './cinco-s';
import { CincoSService, CatalogoCincoS, ResumenCincoS } from '../../services/cinco-s.service';

describe('Formulario 5S', () => {
  const catalogo: CatalogoCincoS = { categorias: Array.from({ length: 5 }, (_, g) => ({ id: g + 1, nombre: 'Categoria ' + (g + 1), criterios: Array.from({ length: 4 }, (_, i) => ({ id: g * 4 + i + 1, concepto: 'Criterio', pregunta: 'Punto a verificar' })) })), escala: ['Muy deficiente', 'Deficiente', 'Regular', 'Bueno', 'Excelente', 'Supera expectativas'], departamentos: [{ idDepartamento: 3, nombreDepartamento: 'Bodega' }] };
  const vacio: ResumenCincoS = { idDepartamento: 3, anio: 2026, mes: 10, inspecciones: [], completo: false, promedio: null, puntosKpi: null, inspeccionesRegistradas: 0 };
  const service = { catalogo: vi.fn(), consultar: vi.fn(), guardar: vi.fn(), recalcular: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks(); service.catalogo.mockReturnValue(of(catalogo)); service.consultar.mockReturnValue(of(vacio));
    TestBed.configureTestingModule({ imports: [CincoS], providers: [provideRouter([]), { provide: CincoSService, useValue: service }] });
  });
  function abrir() {
    const f = TestBed.createComponent(CincoS); f.detectChanges();
    f.componentInstance.filtro.controls.periodo.setValue('2026-10');
    f.componentInstance.consultar(); f.detectChanges(); return f;
  }
  it('muestra los 20 criterios y seis opciones por criterio', () => {
    const f = abrir();
    expect(f.nativeElement.querySelectorAll('.criterion').length).toBe(20);
    expect(f.nativeElement.querySelectorAll('input[type=radio]').length).toBe(120);
    expect(f.nativeElement.textContent).toContain('Pendiente');
    const radio = f.nativeElement.querySelector('input[type=radio]') as HTMLInputElement;
    radio.click(); expect(f.componentInstance.puntos.at(0).value).toBe(0);
  });
  it('rechaza datos incompletos y permite una nota de cero real', () => {
    const f = abrir(), c = f.componentInstance;
    c.guardar(); expect(service.guardar).not.toHaveBeenCalled();
    c.form.patchValue({ fecha: '2026-10-09', sucursal: 'Zona 7', encargado: 'Responsable', puntos: Array(20).fill(0) });
    service.guardar.mockReturnValue(of({ ...vacio, inspeccionesRegistradas: 1, inspecciones: [{ idInspeccion: 1, numero: 1, fecha: '2026-10-09', total: 0, puntos: Array(20).fill(0) }] }));
    c.guardar(); expect(service.guardar).toHaveBeenCalledWith(expect.objectContaining({ idDepartamento: 3, puntos: Array(20).fill(0) }));
    expect(c.form.controls.numero.value).toBe(2); expect(c.resumen()?.puntosKpi).toBeNull();
  });
  it('rechaza fechas de otro mes y evita guardados duplicados', () => {
    const f = abrir(), c = f.componentInstance;
    c.form.patchValue({ fecha: '2026-11-09', sucursal: 'Zona 7', encargado: 'Responsable', puntos: Array(20).fill(5) });
    c.guardar(); expect(service.guardar).not.toHaveBeenCalled();
    c.form.controls.fecha.setValue('2026-10-09'); service.guardar.mockReturnValue(new Subject());
    c.guardar(); c.guardar(); expect(service.guardar).toHaveBeenCalledTimes(1);
  });
  it('muestra 18.5% sin aproximarlos y cierra el formulario al completar dos inspecciones', () => {
    service.consultar.mockReturnValue(of({ ...vacio, completo: true, promedio: 92.5, puntosKpi: 18.5, inspeccionesRegistradas: 2 }));
    const f = abrir();
    expect(f.nativeElement.textContent).toContain('18.5% / 20%');
    expect(f.nativeElement.querySelectorAll('.criterion').length).toBe(0);
    f.componentInstance.guardar(); expect(service.guardar).not.toHaveBeenCalled();
  });

  it('recalcula el periodo consultado y muestra las evaluaciones creadas', () => {
    service.consultar.mockReturnValue(of({ ...vacio, completo: true, promedio: 92.5, puntosKpi: 18.5, inspeccionesRegistradas: 2 }));
    const f = abrir(), c = f.componentInstance;
    service.recalcular.mockReturnValue(of({ resumen: { ...vacio, completo: true, promedio: 92.5, puntosKpi: 18.5, inspeccionesRegistradas: 2 }, evaluacionesCreadas: 12, evaluacionesActualizadas: 0, empleadosSinDatos: [] }));
    c.filtro.controls.periodo.setValue('2026-11');
    c.recalcular();
    expect(service.recalcular).toHaveBeenCalledWith(3, 2026, 10);
    expect(c.aviso()).toContain('12 creadas');
    expect(c.saving()).toBe(false);
  });
});
