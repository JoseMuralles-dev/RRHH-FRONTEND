import { referenciaVentas } from './ventas.service';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { DashboardVentas, MetaVentas, ResultadoVentas, Vendedor, VentasApi, errorVentas } from './ventas.service';
@Component({selector:'app-ventas', imports:[FormsModule], templateUrl:'./ventas.html', styleUrl:'./ventas.css'})
export class Ventas {
  readonly referencia = referenciaVentas;
  private readonly api = inject(VentasApi);
  private readonly destroy = inject(DestroyRef);
  readonly usuario = inject(AuthService).getUsuarioSesion();
  readonly nivel = this.usuario?.nivelJerarquico ?? 0;
  readonly hoy = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  periodo = this.hoy.slice(0,7); vista = this.nivel >= 2 ? 'equipo' : 'propio';
  readonly seleccionado = signal(0);
  readonly vendedores = signal<Vendedor[]>([]);
  readonly datos = signal<DashboardVentas|null>(null);
  readonly cargando = signal(false); readonly guardando = signal(false);
  readonly error = signal(''); readonly errorCatalogo = signal(''); readonly errorFormulario = signal(''); readonly aviso = signal('');
  readonly metas = signal<MetaVentas[]>([]); readonly cargandoMetas = signal(false); readonly cargandoClientes = signal(false);
  readonly clientesListos = signal(false); readonly metaLista = signal(false);
  readonly visibles = computed(() => (this.datos()?.empleados ?? []).filter(e => !this.seleccionado() || e.idEmpleado === this.seleccionado()));
  readonly actual = computed(() => this.datos()?.empleados.find(e => e.idEmpleado === this.seleccionado()));
  readonly puedeCapturar = computed(() => this.nivel >= 2 && this.vista === 'equipo' && this.seleccionado() > 0);
  periodoMeta = this.periodo; meta = ''; fecha = this.hoy; cantidad: number|null = null;
  private consulta?: Subscription; private consultaMetas?: Subscription; private consultaClientes?: Subscription;
  readonly nombres: Record<string,string> = { VEN_META_MENSUAL:'Meta mensual', VEN_META_ACUMULADA:'Meta acumulada', VEN_NUEVOS_CLIENTES:'Nuevos clientes', VEN_NOTAS_CREDITO:'Notas de credito', VEN_CARTERA_SANA:'Cartera menor a 60 dias' };
  readonly estados: Record<string,string> = { SIN_ACTUALIZAR:'Sin carga registrada', REVISION_NC_NEGATIVAS:'Notas de credito negativas: requiere revision', REVISION_CARTERA_NEGATIVA:'Cartera negativa: requiere revision', OK:'Completo', COMPLETA:'Completa', INCOMPLETA:'Evaluacion incompleta', SIN_META:'Sin meta configurada', META_INCOMPLETA:'Faltan metas mensuales', REGLA_PENDIENTE:'Regla pendiente de aprobacion', SIN_DENOMINADOR:'Porcentaje no calculable', CODIGO_SAP_INVALIDO:'Codigo SAP ausente o invalido', CONFLICTO_CODIGO_SAP:'Codigo SAP duplicado', SIN_CORRESPONDENCIA:'Vendedor sin correspondencia en SAP', CONFLICTO_REGISTROS_DIARIOS:'Registros diarios duplicados', CERRADA_SIN_SNAPSHOT:'Evaluacion cerrada sin detalle historico' };
  constructor() { this.catalogo(); this.cargar(); }
  estado(s: string) { return this.estados[s] ?? s; }
  periodoValido(p: string) { return /^20\d{2}-(0[1-9]|1[0-2])$/.test(p) || /^2100-(0[1-9]|1[0-2])$/.test(p); }
  catalogo() { this.errorCatalogo.set(''); this.api.empleados().pipe(takeUntilDestroyed(this.destroy)).subscribe({next: v => this.vendedores.set(v),error:e=>this.errorCatalogo.set(errorVentas(e))}); }
  cargar() {
    if (this.guardando()) return;
    this.consulta?.unsubscribe(); this.datos.set(null); this.error.set('');
    if (!this.periodoValido(this.periodo) || this.periodo > this.hoy.slice(0,7)) { this.cargando.set(false); this.error.set('Selecciona un mes valido, no futuro.'); return; }
    this.cargando.set(true);
    this.consulta = this.api.dashboard(this.periodo,this.vista==='equipo').pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.cargando.set(false)))
      .subscribe({next:d=>this.datos.set(d),error:e=>this.error.set(errorVentas(e))});
  }
  cambiarVista() { this.elegir(0); this.aviso.set(''); this.cargar(); }
  elegir(id: number) {
    this.seleccionado.set(Number(id)); this.errorFormulario.set(''); this.aviso.set('');
    this.consultaMetas?.unsubscribe(); this.consultaClientes?.unsubscribe(); this.metas.set([]); this.meta=''; this.cantidad=null; this.metaLista.set(false); this.clientesListos.set(false);
    if (this.puedeCapturar()) { this.cargarMetas(); this.cargarClientes(); }
  }
  cargarMetas() {
    this.consultaMetas?.unsubscribe(); this.meta=''; this.metas.set([]); this.metaLista.set(false);
    if (!this.seleccionado() || !this.periodoValido(this.periodoMeta)) return;
    this.cargandoMetas.set(true);
    this.consultaMetas=this.api.metas(this.seleccionado(),this.periodoMeta).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.cargandoMetas.set(false)))
      .subscribe({next:m=>{this.metas.set(m); this.meta=m.find(x=>x.periodoMes===Number(this.periodoMeta.slice(5)))?.metaObjetivo??'';this.metaLista.set(true);},error:e=>this.errorFormulario.set(errorVentas(e))});
  }
  cargarClientes() {
    this.consultaClientes?.unsubscribe(); this.clientesListos.set(false); this.cantidad=null;
    if (!this.seleccionado() || !/^\d{4}-\d{2}-\d{2}$/.test(this.fecha) || this.fecha > this.hoy) return;
    this.cargandoClientes.set(true);
    this.consultaClientes=this.api.clientes(this.seleccionado(),this.fecha).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.cargandoClientes.set(false)))
      .subscribe({next:r=>{this.cantidad=r.cantidad;this.clientesListos.set(true);},error:e=>this.errorFormulario.set(errorVentas(e))});
  }
  guardarMeta() {
    if (this.nivel < 3 || !this.puedeCapturar() || this.guardando() || !this.metaLista()) return;
    if (!/^\d{1,12}(\.\d{1,2})?$/.test(this.meta) || Number(this.meta)<=0) { this.errorFormulario.set('Ingresa una meta positiva con hasta dos decimales.'); return; }
    this.guardando.set(true); this.errorFormulario.set(''); this.aviso.set('');
    this.api.guardarMeta(this.seleccionado(),this.periodoMeta,this.meta).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.guardando.set(false)))
      .subscribe({next:()=>{this.guardando.set(false);this.aviso.set('Meta guardada. Se reflejara en la proxima carga diaria. El acumulado usa las metas de enero al mes evaluado.');this.cargarMetas();this.cargar();},error:e=>this.errorFormulario.set(errorVentas(e))});
  }
  guardarClientes() {
    if (!this.puedeCapturar() || this.guardando() || !this.clientesListos()) return;
    if (this.cantidad===null || !Number.isInteger(this.cantidad) || this.cantidad<0 || this.cantidad>1000000) {this.errorFormulario.set('Ingresa una cantidad entera entre 0 y 1000000.');return;}
    this.guardando.set(true); this.errorFormulario.set(''); this.aviso.set('');
    this.api.guardarClientes(this.seleccionado(),this.fecha,this.cantidad).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.guardando.set(false)))
      .subscribe({next:()=>{this.guardando.set(false);this.aviso.set('Total diario guardado. Se reflejara en la proxima carga diaria. Reemplaza la cantidad anterior, no se suma nuevamente.');this.cargar();},error:e=>this.errorFormulario.set(errorVentas(e))});
  }
  guardarEvaluacion(e: ResultadoVentas) {
    if (this.nivel<2 || this.vista!=='equipo' || this.guardando() || e.cerrado || e.notaFinal===null) return;
    this.guardando.set(true); this.aviso.set(''); this.errorFormulario.set('');
    this.api.evaluar(e.idEmpleado,this.periodo).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.guardando.set(false)))
      .subscribe({next:r=>{this.guardando.set(false);this.aviso.set(r.guardado?'Evaluacion guardada con sus metas y reglas.':'La evaluacion sigue incompleta; no se guardo una nota.');this.cargar();},error:err=>this.errorFormulario.set(errorVentas(err))});
  }
  arco(n: string|null) { return n===null ? 0 : Math.max(0,Math.min(100,Number(n))); }
}
