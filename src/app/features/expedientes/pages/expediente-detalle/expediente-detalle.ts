import { Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, finalize, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { EmpleadoService } from '../../../empleados/services/empleado.service';
import { nombreCompleto } from '../../../empleados/models/empleado.model';
import { DocumentoCard } from '../../components/documento-card/documento-card';
import { ExpedienteResumen } from '../../components/expediente-resumen/expediente-resumen';
import { DocumentoExpediente, ExpedienteEmpleadoResponse, TipoDocumentoExpediente } from '../../models/expediente.model';
import { errorExpediente, ExpedienteService } from '../../services/expediente.service';
import { fechaCalendario, guardarBlob, hoyGuatemala, vencimiento } from '../../utils/documento-utils';
@Component({ selector: 'app-expediente-detalle', imports: [DatePipe, ReactiveFormsModule, RouterLink, DocumentoCard, ExpedienteResumen], templateUrl: './expediente-detalle.html', styleUrl: './expediente-detalle.css' })
export class ExpedienteDetalle {
  private readonly service = inject(ExpedienteService);
  private readonly empleadosService = inject(EmpleadoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  private vistaRequest?: Subscription;
  private readonly sanitizer = inject(DomSanitizer);
  @ViewChild('visor', { static: true }) private visor!: ElementRef<HTMLDialogElement>;
  readonly vista = signal<{ documento: DocumentoExpediente; url: string; segura: SafeResourceUrl; tipo: string } | null>(null);
  readonly cargandoVista = signal(false);
  readonly errorVista = signal('');
  previsualizar(documento: DocumentoExpediente) {
    if (!this.capacidades.previsualizar || this.ocupado() !== null) return;
    this.cerrarVista();
    this.cargandoVista.set(true); this.errorVista.set(''); this.error.set('');
    this.visor.nativeElement.showModal();
    this.vistaRequest = this.service.previsualizarDocumento(documento.idExpediente, documento.idDocumento)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargandoVista.set(false)))
      .subscribe({
        next: blob => {
          if (!['application/pdf', 'image/jpeg', 'image/png'].includes(blob.type)) {
            this.errorVista.set('El formato recibido no admite previsualización. Puedes descargar el documento desde su tarjeta.'); return;
          }
          const url = URL.createObjectURL(blob);
          this.vista.set({ documento, url, segura: this.sanitizer.bypassSecurityTrustResourceUrl(url), tipo: blob.type });
        },
        error: e => this.errorVista.set(errorExpediente(e)),
      });
  }
  cerrarVista() {
    this.vistaRequest?.unsubscribe();
    const vista = this.vista();
    if (vista) URL.revokeObjectURL(vista.url);
    this.vista.set(null);
    if (this.visor?.nativeElement.open) this.visor.nativeElement.close();
  }
  readonly administrar = inject(AuthService).getNivelJerarquico() >= 3;
  readonly capacidades = this.service.capacidades;
  readonly idEmpleado = signal(0);
  readonly nombre = signal('');
  readonly expediente = signal<ExpedienteEmpleadoResponse | null>(null);
  readonly tipos = signal<TipoDocumentoExpediente[] | null>(null);
  readonly loading = signal(false); readonly saving = signal(false);
  readonly error = signal(''); readonly errorTipos = signal(''); readonly aviso = signal(''); readonly noExiste = signal(false);
  readonly filtro = signal('TODOS'); readonly ocupado = signal<number | null>(null);
  readonly editando = signal<DocumentoExpediente | null>(null);
  readonly filtros = [{ valor: 'TODOS', texto: 'Todos' }, { valor: 'VIGENTE', texto: 'Vigentes' }, { valor: 'PROXIMO', texto: 'Por vencer' }, { valor: 'VENCIDO', texto: 'Vencidos' }];
  readonly crearForm = this.fb.nonNullable.group({ fechaApertura: [hoyGuatemala(), Validators.required], observaciones: ['', Validators.maxLength(5000)] });
  readonly editarForm = this.fb.nonNullable.group({ fechaDocumento: [''], fechaVencimiento: [''], observaciones: ['', Validators.maxLength(5000)] });
  readonly documentos = computed(() => (this.expediente()?.documentos ?? []).filter(d => d.isActive));
  readonly visibles = computed(() => this.documentos().filter(d => this.filtro() === 'TODOS' || vencimiento(d) === this.filtro()
    || (this.filtro() === 'VIGENTE' && !d.tipoDocumento?.requiereVencimiento && vencimiento(d) === 'SIN_FECHA')));
  readonly proximos = computed(() => this.documentos().filter(d => vencimiento(d) === 'PROXIMO').length);
  readonly vencidos = computed(() => this.documentos().filter(d => vencimiento(d) === 'VENCIDO').length);
  readonly obligatorios = computed(() => (this.tipos() ?? []).filter(t => t.isActive && t.esObligatorio).map(t => ({ ...t, cargado: this.documentos().some(d => d.idTipoDocumento === t.idTipoDocumento) })));
  readonly completos = computed(() => this.obligatorios().filter(t => t.cargado).length);
  constructor() {
    this.destroyRef.onDestroy(() => this.cerrarVista());
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.cerrarVista(); this.idEmpleado.set(Number(params.get('idEmpleado'))); this.filtro.set('TODOS'); this.cargar();
    });
  }
  cargar() {
    if (this.saving() || this.ocupado() !== null) return;
    this.consulta?.unsubscribe(); this.expediente.set(null); this.tipos.set(null); this.noExiste.set(false); this.editando.set(null); this.nombre.set(''); this.error.set(''); this.errorTipos.set('');
    const id = this.idEmpleado();
    if (!this.administrar || !Number.isSafeInteger(id) || id < 1) { this.error.set('No tienes acceso o el identificador de empleado no es válido.'); return; }
    this.loading.set(true);
    this.consulta = forkJoin({
      expediente: this.service.obtenerExpedienteEmpleado(id).pipe(catchError((e: unknown) => { if (e instanceof HttpErrorResponse && e.status === 404) this.noExiste.set(true); else this.error.set(errorExpediente(e)); return of(null); })),
      tipos: this.service.listarTiposDocumento().pipe(catchError((e: unknown) => { this.errorTipos.set(errorExpediente(e)); return of(null); })),
      empleado: this.empleadosService.obtener(id).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe(({ expediente, tipos, empleado }) => {
      this.expediente.set(expediente); this.tipos.set(tipos);
      const e = expediente?.empleado;
      this.nombre.set(e ? [e.primerNombre, e.segundoNombre, e.primerApellido, e.segundoApellido].filter(Boolean).join(' ') : empleado ? nombreCompleto(empleado) : `Empleado #${id}`);
    });
  }
  crear() {
    this.crearForm.markAllAsTouched(); const value = this.crearForm.getRawValue();
    if (!this.administrar || !this.noExiste() || this.saving() || this.loading()) return;
    if (this.crearForm.invalid || fechaCalendario(value.fechaApertura) === null) { this.error.set('Revisa la fecha de apertura y las observaciones.'); return; }
    this.saving.set(true); this.error.set('');
    this.service.crearExpediente({ idEmpleado: this.idEmpleado(), fechaApertura: value.fechaApertura, ...(value.observaciones.trim() ? { observaciones: value.observaciones.trim() } : {}) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.aviso.set('Expediente creado. Ya puedes cargar documentos.'); this.cargar(); }, error: e => { this.saving.set(false); this.error.set(errorExpediente(e)); },
    });
  }
  descargar(documento: DocumentoExpediente) {
    if (!this.capacidades.descargar || this.ocupado() !== null) return;
    this.ocupado.set(documento.idDocumento); this.error.set('');
    this.service.descargarDocumento(documento.idExpediente, documento.idDocumento).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.ocupado.set(null))).subscribe({ next: blob => guardarBlob(blob, documento.nombreOriginal), error: e => this.error.set(errorExpediente(e)) });
  }
  editar(documento: DocumentoExpediente) {
    if (!this.administrar || !this.capacidades.editar || this.ocupado() !== null) return;
    this.editando.set(documento); this.editarForm.setValue({ fechaDocumento: documento.fechaDocumento ?? '', fechaVencimiento: documento.fechaVencimiento ?? '', observaciones: documento.observaciones ?? '' });
  }
  guardarMetadata() {
    const d = this.editando(); if (!d || !this.administrar || !this.capacidades.editar || this.ocupado() !== null) return;
    this.editarForm.markAllAsTouched(); const v = this.editarForm.getRawValue();
    if (this.editarForm.invalid || (v.fechaDocumento && fechaCalendario(v.fechaDocumento) === null) || (v.fechaVencimiento && fechaCalendario(v.fechaVencimiento) === null) || (d.tipoDocumento?.requiereVencimiento && !v.fechaVencimiento)) { this.error.set('Revisa las fechas del documento.'); return; }
    this.ocupado.set(d.idDocumento); this.error.set('');
    this.service.actualizarDocumento(d.idDocumento, { ...(v.fechaDocumento ? { fechaDocumento: v.fechaDocumento } : {}), ...(v.fechaVencimiento ? { fechaVencimiento: v.fechaVencimiento } : {}), observaciones: v.observaciones.trim() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.ocupado.set(null); this.aviso.set('Datos actualizados.'); this.cargar(); }, error: e => { this.ocupado.set(null); this.error.set(errorExpediente(e)); } });
  }
  eliminar(documento: DocumentoExpediente) {
    if (!this.administrar || !this.capacidades.eliminar || this.ocupado() !== null || !window.confirm(`¿Desactivar ${documento.nombreOriginal}?`)) return;
    this.ocupado.set(documento.idDocumento); this.error.set('');
    this.service.eliminarDocumento(documento.idDocumento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.ocupado.set(null); this.aviso.set('Documento desactivado.'); this.cargar(); }, error: e => { this.ocupado.set(null); this.error.set(errorExpediente(e)); } });
  }
}
