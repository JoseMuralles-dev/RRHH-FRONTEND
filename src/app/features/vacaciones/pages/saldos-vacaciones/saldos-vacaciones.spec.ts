import { API } from '../../../../core/config/apis';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { SaldosVacaciones } from './saldos-vacaciones';
const base = API.baseUrl;
const saldo = { idEmpleado: 10, saldoTotal: '8.00', diasReservados: '5.00', diasDisponibles: '3.00', requiereConciliacion: false, incidencias: [], periodos: [] };
describe('Conexión de saldos de vacaciones', () => {
  let http: HttpTestingController;
  function abrir(nivel = 1, idEmpleado: number | null = 10) {
    TestBed.configureTestingModule({ imports: [SaldosVacaciones], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { getUsuarioSesion: () => ({ idUsuario: 1, idEmpleado, nivelJerarquico: nivel }), logout: vi.fn() } }] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SaldosVacaciones); fixture.detectChanges();
    if (idEmpleado) http.expectOne(base + '/vacaciones/mi-saldo').flush(saldo);
    if (nivel >= 2) http.expectOne(base + '/vacaciones/empleados-disponibles').flush([{ idEmpleado: 20, nombreCompleto: 'Empleado veinte' }]);
    return { fixture, component: fixture.componentInstance };
  }
  afterEach(() => http.verify());
  it('muestra importes y conciliación sin inventar reservas por período', async () => {
    const { fixture, component } = abrir(); component.cargar();
    http.expectOne(base + '/vacaciones/mi-saldo').flush({ ...saldo, requiereConciliacion: true, incidencias: ['Revisar corte inicial'] });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('3.00 días');
    expect(fixture.nativeElement.textContent).toContain('Revisar corte inicial');
    expect(fixture.nativeElement.textContent).not.toContain('Cargar período');
  });
  it('cancela lecturas previas al cambiar empleado y limpia datos', () => {
    const { component } = abrir(3); component.cargar(); const anterior = http.expectOne(base + '/vacaciones/mi-saldo');
    component.empleadoElegido = 20; component.consultarEmpleado(); expect(anterior.cancelled).toBe(true); expect(component.datos()).toEqual({});
    http.expectOne(base + '/vacaciones/empleados/20/saldo').flush({ ...saldo, idEmpleado: 20 });
    expect(component.datos().saldo?.idEmpleado).toBe(20);
  });
  it('pagina movimientos usando las rutas propias y no acepta IDs del empleado común', () => {
    const { component } = abrir(); component.empleadoElegido = 20; component.consultarEmpleado(); http.expectNone(base + '/vacaciones/empleados/20/saldo');
    component.cambiarVista('movimientos'); http.expectOne(base + '/vacaciones/mi-saldo').flush(saldo);
    http.expectOne(base + '/vacaciones/mis-movimientos?pagina=1&limite=20').flush({ items: [], total: 21, pagina: 1, limite: 20 });
    component.paginar(1); http.expectOne(base + '/vacaciones/mi-saldo').flush(saldo);
    http.expectOne(base + '/vacaciones/mis-movimientos?pagina=2&limite=20').flush({ items: [], total: 21, pagina: 2, limite: 20 });
    expect(component.puedeSiguiente).toBe(false);
  });
  it('guarda solo campos del período, conserva decimales y evita doble envío', () => {
    const { component } = abrir(3); component.abrirPeriodo();
    component.periodo = { fechaInicio: '2025-01-01', fechaFin: '2025-12-31', diasAsignados: '12.50', diasUtilizadosIniciales: '2.00', fechaCorteInicial: '2026-09-30', observaciones: ' Carga inicial ' };
    component.guardarPeriodo(); component.guardarPeriodo();
    const req = http.expectOne(base + '/vacaciones/empleados/10/periodos'); expect(req.request.method).toBe('POST');
    expect(req.request.body.diasAsignados).toBe('12.50'); expect(req.request.body.idEmpleadoRegistro).toBeUndefined();
    req.flush({ idPeriodo: 7 }); http.expectOne(base + '/vacaciones/mi-saldo').flush(saldo);
    expect(component.aviso()).toContain('guardado');
  });
  it('valida consumo histórico y mantiene formulario ante conflicto', () => {
    const { component } = abrir(3); component.abrirPeriodo();
    component.periodo = { fechaInicio: '2025-01-01', fechaFin: '2025-12-31', diasAsignados: '2.00', diasUtilizadosIniciales: '3.00', fechaCorteInicial: null, observaciones: null };
    component.guardarPeriodo(); http.expectNone(r => r.method === 'POST');
    component.periodo.diasUtilizadosIniciales = '0.00'; component.guardarPeriodo();
    http.expectOne(base + '/vacaciones/empleados/10/periodos').flush({ message: 'Período superpuesto', incidencias: ['Revise las fechas'] }, { status: 409, statusText: 'Conflict' });
    expect(component.formulario()).toBe('periodo'); expect(component.error()).toContain('Revise las fechas');
  });
  it('administrador sin empleado puede elegir otro sin consultar mi-saldo', () => {
    const { component } = abrir(4, null); expect(component.error()).toContain('Selecciona un empleado');
    component.empleadoElegido = 20; component.consultarEmpleado(); http.expectOne(base + '/vacaciones/empleados/20/saldo').flush({ ...saldo, idEmpleado: 20 });
    component.abrirAjuste({ idPeriodo: 1 } as any); expect(component.formulario()).toBeNull();
  });
  it('calendario de equipo envia rango y paginación, rechaza rangos excesivos', () => {
    const { component } = abrir(2); component.desde = '2026-10-01'; component.hasta = '2026-10-31'; component.equipo = true;
    component.cambiarVista('calendario'); http.expectOne(base + '/vacaciones/calendario/equipo?desde=2026-10-01&hasta=2026-10-31&pagina=1&limite=20').flush({ items: [], total: 0, pagina: 1, limite: 20 });
    component.hasta = '2028-10-31'; component.consultarCalendario(); http.expectNone(r => r.url.endsWith('/calendario/equipo'));
    expect(component.error()).toContain('366');
  });
  it('registra un ajuste desde movimientos y actualiza el saldo y el historial', () => {
    const { component } = abrir(3);
    const conPeriodo = { ...saldo, periodos: [{ idPeriodo: 7, saldoDias: '8.00' }] };
    component.cambiarVista('movimientos');
    http.expectOne(base + '/vacaciones/mi-saldo').flush(conPeriodo);
    http.expectOne(base + '/vacaciones/mis-movimientos?pagina=1&limite=20').flush({ items: [], total: 0 });
    component.abrirAjuste();
    expect(component.periodoId).toBe(7);
    component.ajuste = { tipoMovimiento: 'AJUSTE_NEGATIVO', dias: '2.00', motivo: ' Corrección autorizada ' };
    component.guardarAjuste(); component.guardarAjuste();
    const req = http.expectOne(base + '/vacaciones/empleados/10/periodos/7/ajustes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tipoMovimiento: 'AJUSTE_NEGATIVO', dias: '2.00', motivo: 'Corrección autorizada' });
    req.flush({ idMovimiento: 1 });
    http.expectOne(base + '/vacaciones/mi-saldo').flush({ ...conPeriodo, saldoTotal: '6.00' });
    http.expectOne(base + '/vacaciones/mis-movimientos?pagina=1&limite=20').flush({ items: [], total: 1 });
    expect(component.formulario()).toBeNull();
    expect(component.datos().saldo?.saldoTotal).toBe('6.00');
  });
  it('no abre ajustes sin un período registrado', () => {
    const { component } = abrir(3); component.abrirAjuste();
    expect(component.formulario()).toBeNull();
    expect(component.error()).toContain('Primero registra un período');
    http.expectNone(r => r.method === 'POST');
  });
  it('edita un período por PATCH y conserva el empleado consultado', () => {
    const { component } = abrir(3);
    component.empleadoElegido = 20; component.consultarEmpleado();
    http.expectOne(base + '/vacaciones/empleados/20/saldo').flush({ ...saldo, idEmpleado: 20 });
    component.abrirPeriodo({ idPeriodo: 7, idEmpleado: 20, fechaInicio: '2025-01-01', fechaFin: '2025-12-31', diasAsignados: '15.00', diasUtilizadosIniciales: '0.00', fechaCorteInicial: null, observaciones: '', createdAt: '', updatedAt: '' });
    component.periodo.observaciones = 'Revisión de RRHH'; component.guardarPeriodo();
    const req = http.expectOne(base + '/vacaciones/empleados/20/periodos/7');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.observaciones).toBe('Revisión de RRHH');
    req.flush({ idPeriodo: 7 });
    http.expectOne(base + '/vacaciones/empleados/20/saldo').flush({ ...saldo, idEmpleado: 20 });
  });  it('ofrece selector al encargado sin un campo manual de ID', async () => {
    const { fixture } = abrir(2); await fixture.whenStable();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[name=empleado]');
    expect(select.textContent).toContain('Empleado veinte');
    expect(select.textContent).toContain('Todo mi equipo');
    expect(fixture.nativeElement.querySelector('input[name=empleado]')).toBeNull();
  });
  it('consulta todos los saldos del alcance sin inventar un ID y aplica filtros', () => {
    const { component } = abrir(2);
    component.empleadoElegido = 'todos'; component.consultarEmpleado();
    const req = http.expectOne(r => r.url === base + '/vacaciones/saldos-tabla');
    expect(req.request.params.has('idEmpleado')).toBe(false);
    req.flush({ items: [], total: 25, pagina: 1, limite: 20 });
    component.paginar(1);
    const pag = http.expectOne(r => r.url.endsWith('/saldos-tabla')); expect(pag.request.params.get('pagina')).toBe('2');
    pag.flush({ items: [], total: 25 });
    component.empleadoElegido = 20; component.buscar = 'Ana'; component.orden = 'saldo'; component.direccion = 'DESC'; component.consultarEmpleado();
    const filtrado = http.expectOne(r => r.url.endsWith('/saldos-tabla'));
    expect(filtrado.request.params.get('idEmpleado')).toBe('20');
    expect(filtrado.request.params.get('buscar')).toBe('Ana');
    expect(filtrado.request.params.get('pagina')).toBe('1');
    filtrado.flush({ items: [], total: 0 });
    component.verEmpleado(20);
    http.expectOne(base + '/vacaciones/empleados/20/saldo').flush({ ...saldo, idEmpleado: 20 });
    expect(component.vista()).toBe('saldo');
  });
  it('oculta la tabla general al empleado común', () => {
    const { component } = abrir(1); component.cambiarVista('tabla');
    http.expectNone(r => r.url.endsWith('/saldos-tabla'));
    expect(component.vista()).toBe('saldo');
  });});
