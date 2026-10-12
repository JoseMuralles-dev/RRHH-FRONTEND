import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';

import { EmpleadoOpcion } from '../../../empleados/models/empleado.model';
import { VacacionesService, errorVacaciones } from '../../vacaciones.service';
import { FilaSaldoVacaciones, OrdenSaldo, AjusteVacaciones, CalendarioVacaciones, MovimientoVacaciones, Pagina, PeriodoDatos, PeriodoVacaciones, SaldoVacaciones } from '../../models/vacaciones.model';

type Vista = 'tabla' | 'saldo' | 'movimientos' | 'periodos' | 'calendario';
interface Datos { tabla?: Pagina<FilaSaldoVacaciones>; saldo?: SaldoVacaciones; movimientos?: Pagina<MovimientoVacaciones>; periodos?: Pagina<PeriodoVacaciones>; calendario?: Pagina<CalendarioVacaciones>; }
const periodoVacio = (): PeriodoDatos => ({ fechaInicio: '', fechaFin: '', diasAsignados: '', diasUtilizadosIniciales: '0.00', fechaCorteInicial: '', observaciones: '' });
function fechaValida(value: string): boolean {
  const date = new Date(value + 'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function centesimas(value: string): number | null {
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(value)) return null;
  const [entero, fraccion = ''] = value.split('.');
  return Number(entero) * 100 + Number(fraccion.padEnd(2, '0'));
}
@Component({ selector: 'app-saldos-vacaciones', imports: [CommonModule, FormsModule, RouterLink], templateUrl: './saldos-vacaciones.html', styleUrl: './saldos-vacaciones.css' })
export class SaldosVacaciones {
  private readonly service = inject(VacacionesService);

  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cambios = new Subject<void>();
  readonly usuario = this.auth.getUsuarioSesion();
  readonly puedeGestionar = (this.usuario?.nivelJerarquico ?? 0) >= 3;
  readonly puedeEquipo = [2, 3, 4].includes(this.usuario?.nivelJerarquico ?? 0);
  readonly vista = signal<Vista>('saldo');
  readonly datos = signal<Datos>({});
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');
  readonly errorEmpleados = signal('');
  readonly empleados = signal<EmpleadoOpcion[]>([]);
  readonly formulario = signal<'periodo' | 'ajuste' | null>(null);
  empleadoElegido: number | 'todos' | null = null;
  buscar = '';
  orden: OrdenSaldo = 'nombre';
  direccion: 'ASC' | 'DESC' = 'ASC';
  empleadoConsultado: number | undefined;
  pagina = 1;
  equipo = false;
  private readonly hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  desde = this.hoy.slice(0, 8) + '01';
  hasta = this.hoy;
  periodoId?: number;
  periodo = periodoVacio();
  ajuste: AjusteVacaciones = { tipoMovimiento: 'AJUSTE_POSITIVO', dias: '', motivo: '' };
  get idObjetivo() { return this.empleadoConsultado ?? this.usuario?.idEmpleado ?? undefined; }
  get nombreEmpleado() { return this.empleados().find(e => e.idEmpleado === this.idObjetivo)?.nombreCompleto ?? 'Empleado'; }
  get total() { const d = this.datos(); return d.tabla?.total ?? d.movimientos?.total ?? d.periodos?.total ?? d.calendario?.total ?? 0; }
  get puedeAnterior() { return this.pagina > 1; }
  get puedeSiguiente() { return this.pagina * 20 < this.total; }
  constructor() {
    this.cambios.pipe(startWith(undefined), switchMap(() => {
      this.datos.set({}); this.error.set(''); this.cargando.set(true);
      let consulta: Observable<Datos>;
      if (this.vista() === 'tabla') {
        if (!this.puedeEquipo) { this.error.set('No tienes acceso a la consulta de equipo.'); return of({}); }
        consulta = this.service.tablaSaldos(this.pagina, this.empleadoConsultado, this.buscar.trim(), this.orden, this.direccion).pipe(map(tabla => ({ tabla })));
      } else if (this.vista() === 'calendario') {
        if (!fechaValida(this.desde) || !fechaValida(this.hasta) || this.hasta < this.desde || (Date.parse(this.hasta) - Date.parse(this.desde)) / 86400000 > 365) {
          this.error.set('Selecciona un rango válido de hasta 366 días inclusivos.'); return of({});
        }
        consulta = this.service.calendario(this.desde, this.hasta, this.puedeEquipo && this.equipo, this.pagina).pipe(map(calendario => ({ calendario })));
      } else if (!this.idObjetivo) {
        this.error.set('Selecciona un empleado para consultar sus vacaciones. Tu usuario no tiene empleado asociado.'); return of({});
      } else {
        const saldo = this.service.saldo(this.empleadoConsultado);
        if (this.vista() === 'movimientos') consulta = forkJoin({ saldo, movimientos: this.service.movimientos(this.pagina, this.empleadoConsultado) });
        else if (this.vista() === 'periodos') consulta = forkJoin({ saldo, periodos: this.service.periodos(this.idObjetivo, this.pagina) });
        else consulta = saldo.pipe(map(saldo => ({ saldo })));
      }
      return consulta.pipe(catchError(e => { this.error.set(errorVacaciones(e)); return of({}); }));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(datos => { this.datos.set(datos); this.cargando.set(false); });
    if (this.puedeEquipo) this.cargarEmpleados();
  }
  cargarEmpleados() {
    this.errorEmpleados.set('');
    this.service.empleadosDisponibles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: e => this.empleados.set(e), error: e => this.errorEmpleados.set(errorVacaciones(e)) });
  }
  cargar() { if (!this.guardando()) this.cambios.next(); }
  cambiarVista(vista: Vista) { if (this.guardando()) return; if (vista === 'tabla') { if (!this.puedeEquipo) return; this.empleadoElegido = 'todos'; this.empleadoConsultado = undefined; } else if (this.empleadoElegido === 'todos') { this.empleadoElegido = null; this.empleadoConsultado = undefined; } this.vista.set(vista); this.pagina = 1; this.formulario.set(null); this.aviso.set(''); this.cargar(); }
  consultarEmpleado() {
    if (this.guardando()) return;
    if (this.empleadoElegido === 'todos') {
      if (!this.puedeEquipo) return;
      this.empleadoConsultado = undefined; this.vista.set('tabla');
      this.pagina = 1; this.formulario.set(null); this.aviso.set(''); this.cargar(); return;
    }
    if (this.vista() === 'tabla' && this.empleadoElegido === null) {
      this.vista.set('saldo');
    }
    if (this.empleadoElegido !== null && (!this.puedeEquipo || !Number.isSafeInteger(this.empleadoElegido) || this.empleadoElegido <= 0)) { this.error.set('Selecciona un empleado válido.'); return; }
    this.empleadoConsultado = this.empleadoElegido ?? undefined;
    this.pagina = 1; this.formulario.set(null); this.aviso.set(''); this.cargar();
  }
  verEmpleado(id: number) {
    if (this.guardando()) return;
    this.vista.set('saldo'); this.empleadoElegido = id; this.consultarEmpleado();
  }
  paginar(paso: number) { if (this.cargando() || this.guardando() || (paso > 0 ? !this.puedeSiguiente : !this.puedeAnterior)) return; this.pagina += paso; this.cargar(); }
  consultarCalendario() { this.pagina = 1; this.cargar(); }
  abrirPeriodo(p?: PeriodoVacaciones) {
    if (!this.puedeGestionar || this.guardando() || !this.datos().saldo) return;
    this.error.set(''); this.aviso.set(''); this.periodoId = p?.idPeriodo;
    this.periodo = p ? { fechaInicio: p.fechaInicio, fechaFin: p.fechaFin, diasAsignados: p.diasAsignados, diasUtilizadosIniciales: p.diasUtilizadosIniciales, fechaCorteInicial: p.fechaCorteInicial, observaciones: p.observaciones ?? '' } : periodoVacio();
    this.formulario.set('periodo');
  }
  abrirAjuste(p?: Pick<PeriodoVacaciones, 'idPeriodo'>) {
    if (!this.puedeGestionar || this.guardando() || this.cargando() || !this.usuario?.idEmpleado) return;
    const idPeriodo = p?.idPeriodo ?? this.datos().saldo?.periodos[0]?.idPeriodo;
    if (!idPeriodo) { this.error.set('Primero registra un período para este empleado.'); return; }
    this.error.set(''); this.aviso.set(''); this.periodoId = idPeriodo;
    this.ajuste = { tipoMovimiento: 'AJUSTE_POSITIVO', dias: '', motivo: '' }; this.formulario.set('ajuste');
  }
  guardarPeriodo() {
    if (!this.puedeGestionar || !this.idObjetivo || this.guardando()) return;
    const p = this.periodo, asignados = centesimas(p.diasAsignados), utilizados = centesimas(p.diasUtilizadosIniciales);
    if (!fechaValida(p.fechaInicio) || !fechaValida(p.fechaFin) || p.fechaFin < p.fechaInicio || asignados === null || utilizados === null || utilizados > asignados
      || (utilizados > 0 && !p.fechaCorteInicial) || (p.fechaCorteInicial && !fechaValida(p.fechaCorteInicial)) || (p.observaciones?.length ?? 0) > 500) {
      this.error.set('Revisa fechas y cantidades: máximo dos decimales, consumo inicial no mayor a la asignación y fecha de corte obligatoria si hay consumo histórico.'); return;
    }
    this.guardar(this.service.guardarPeriodo(this.idObjetivo, { ...p, fechaCorteInicial: p.fechaCorteInicial || null, observaciones: p.observaciones?.trim() || null }, this.periodoId), 'Período guardado.');
  }
  guardarAjuste() {
    if (!this.puedeGestionar || !this.idObjetivo || !this.periodoId || !this.usuario?.idEmpleado || this.guardando()) return;
    const dias = centesimas(this.ajuste.dias);
    if (dias === null || dias <= 0 || !this.ajuste.motivo.trim() || this.ajuste.motivo.length > 500) { this.error.set('Indica días positivos con máximo dos decimales y un motivo de hasta 500 caracteres.'); return; }
    this.guardar(this.service.ajustar(this.idObjetivo, this.periodoId, { ...this.ajuste, motivo: this.ajuste.motivo.trim() }), 'Ajuste registrado.');
  }
  private guardar(request: Observable<unknown>, mensaje: string) {
    this.guardando.set(true); this.error.set(''); this.aviso.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.guardando.set(false); this.formulario.set(null); this.aviso.set(mensaje); this.cargar(); }, error: e => { this.guardando.set(false); this.error.set(errorVacaciones(e)); } });
  }
}
