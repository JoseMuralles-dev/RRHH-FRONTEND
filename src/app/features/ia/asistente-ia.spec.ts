import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { IaService } from './ia.service';
import { AsistenteIa } from './asistente-ia';
import { AuthService } from '../../core/services/auth';
import { API } from '../../core/config/apis';

describe('Asistente KPI', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('envía únicamente pregunta y período al backend, sin token interno ni actor', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(IaService).analizar({ anio: 2026, mes: 8, pregunta: 'Mis KPI' }).subscribe();
    const req = http.expectOne(API.baseUrl + '/ia/analizar');
    expect(req.request.body).toEqual({ anio: 2026, mes: 8, pregunta: 'Mis KPI' });
    expect(req.request.headers.has('X-Internal-Token')).toBe(false);
    expect(req.request.headers.has('X-Actor-Id')).toBe(false);
    req.flush({ ok: true, respuesta: 'Resultado', periodo: { anio: 2026, mes: 8 }, idInforme: 1 });
    http.verify();
  });
  function setup(api: any) {
    TestBed.configureTestingModule({
      imports: [AsistenteIa],
      providers: [
        { provide: IaService, useValue: { historial: () => of([]), ...api } },
        { provide: AuthService, useValue: { getNivelJerarquico: () => 1 } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    });
    return TestBed.createComponent(AsistenteIa);
  }
  it('impide doble envío mientras analiza y conserva la pregunta si falla', () => {
    const request = new Subject<any>();
    const analizar = vi.fn(() => request);
    const fixture = setup({ analizar });
    fixture.componentInstance.pregunta = 'Analiza mis KPI';
    fixture.componentInstance.enviar();
    fixture.componentInstance.enviar();
    expect(analizar).toHaveBeenCalledTimes(1);
    request.error(new Error('network'));
    expect(fixture.componentInstance.enviando()).toBe(false);
    expect(fixture.componentInstance.pregunta).toBe('Analiza mis KPI');
    expect(fixture.componentInstance.error()).toContain('No se pudo');
  });
  it('muestra la respuesta como texto y nunca ejecuta HTML del modelo', () => {
    const fixture = setup({ analizar: () => of({ ok: true, respuesta: '<img src=x onerror=alert(1)>',
      periodo: { anio: 2026, mes: 8 }, idInforme: 1 }) });
    fixture.componentInstance.pregunta = 'Analiza mis KPI';
    fixture.componentInstance.enviar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.texto-respuesta').textContent).toContain('<img');
    expect(fixture.nativeElement.querySelector('.texto-respuesta img')).toBeNull();
  });
  it('diferencia el fallo de historial de una lista vacía', () => {
    const fixture = setup({ historial: () => throwError(() => new Error('offline')) });
    expect(fixture.componentInstance.errorHistorial()).toContain('No se pudo cargar');
  });
});