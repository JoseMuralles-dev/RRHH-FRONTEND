import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiDashboardResponse, KpiEvaluacion } from '../../models/dashboard-kpi.model';
@Component({
  selector: 'app-ficha-desempeno', standalone: true, imports: [CommonModule],
  template: `
    <article class="ficha">
      <header><span class="avatar">{{ nombre.charAt(0) }}</span><div><h2>{{ nombre }}</h2>
        <p>{{ dashboard.empleado?.departamento || 'Mi desempeño' }} · Empleado #{{ dashboard.idEmpleado }}</p></div></header>
      <div class="indicador"><h3>Meta alcanzada</h3>
      <svg viewBox="0 0 120 78" role="img" [attr.aria-label]="'Meta alcanzada: ' + (cumplimiento.porcentaje === null ? 'sin datos' : cumplimiento.porcentaje + '%')">
        <path class="base" d="M 12 60 A 48 48 0 0 1 108 60" />
        @if (cumplimiento.porcentaje !== null) {
          <path class="avance" d="M 12 60 A 48 48 0 0 1 108 60" pathLength="100"
            [attr.stroke-dasharray]="limite + ' 100'" />
        }
        <text x="60" y="57" text-anchor="middle">{{ cumplimiento.porcentaje === null ? '—' : (cumplimiento.porcentaje | number:'1.0-2') + '%' }}</text>
      </svg>
      <p class="estado">{{ cumplimiento.porcentaje === null ? 'Sin datos calculables' : cumplimiento.validas < cumplimiento.total ? 'Datos parciales' : 'Cumplimiento de indicadores' }}</p>
      @if (evaluacion?.estado === 'PENDIENTE_5S') { <p class="estado">Nota provisional: faltan inspecciones 5S.</p> }
      </div><div class="resultados"><dl><div><dt>Nota final</dt><dd>{{ evaluacion ? (evaluacion.notaFinal | number:'1.2-2') : '—' }}</dd></div>
        <div><dt>Puntaje base</dt><dd>{{ evaluacion ? (evaluacion.puntajeBase | number:'1.2-2') : '—' }}</dd></div></dl>
      <p>{{ dashboard.diasConDatos }} días con información</p>
      <button type="button" (click)="verDetalle.emit()">Ver detalle</button></div>
    </article>
  `,
  styles: [`
    :host{display:block;margin:24px 0}.ficha{box-sizing:border-box;width:100%;padding:24px;background:white;border:1px solid #e2e8f0;border-radius:16px;color:#1e293b}
    header{display:flex;gap:16px;align-items:center}.avatar{display:grid;place-items:center;flex:0 0 52px;height:52px;border-radius:50%;background:#e5e7eb;font-size:20px;font-weight:700}
    h2{font-size:18px;margin:0;overflow-wrap:anywhere}p,dt{font-size:14px;color:#64748b}header p{margin:8px 0 0}h3{text-align:center;font-size:18px;margin:36px 0 12px}
    svg{display:block;width:220px;max-width:100%;margin:auto;overflow:visible}path{fill:none;stroke-width:10;stroke-linecap:round}.base{stroke:#e2e8f0}.avance{stroke:#0d9488}
    text{fill:#1e293b;font-size:16px;font-weight:750}.estado{text-align:center;margin:0 0 20px}
    dl{display:grid;grid-template-columns:1fr 1fr;gap:12px;border-top:1px solid #f1f5f9;padding-top:20px}dl div{padding:12px;background:#f8fafc;border-radius:8px}dd{margin:8px 0 0;font-weight:700;font-size:23px}
    button{width:100%;border:0;font:inherit;cursor:pointer;display:block;text-align:center;background:#1f2937;color:white;text-decoration:none;padding:16px;border-radius:7px;font-weight:600}button:focus-visible{outline:3px solid #0d9488;outline-offset:3px}
    @media(min-width:900px){.ficha{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,1fr) minmax(0,1fr);gap:32px;align-items:center;padding:32px}h3{margin:0 0 12px}dl{border-top:0;padding-top:0}header{align-self:start}.estado:last-child{margin-bottom:0}}
  `],
})
export class FichaDesempeno {
  @Output() readonly verDetalle = new EventEmitter<void>();
  @Input({ required: true }) dashboard!: KpiDashboardResponse;
  get nombre() { return this.dashboard.empleado?.nombre || 'Mi desempeño'; }
  get evaluacion(): KpiEvaluacion | null { return this.dashboard.evaluaciones[0] ?? null; }
  get cumplimiento() {
    const metricas = new Map<number, number | null>();
    for (const evaluacion of this.dashboard.evaluaciones) for (const resultado of evaluacion.resultados) {
      if (!metricas.has(resultado.idMetrica)) {
        const valor = resultado.porcentajeCumplimiento;
        metricas.set(resultado.idMetrica, typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 ? valor : null);
      }
    }
    const valores = [...metricas.values()].filter((v): v is number => v !== null);
    return { porcentaje: valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null, validas: valores.length, total: metricas.size };
  }
  get limite() { return Math.min(100, Math.max(0, this.cumplimiento.porcentaje ?? 0)); }
}
