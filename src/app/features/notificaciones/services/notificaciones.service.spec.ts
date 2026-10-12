import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { NotificacionesService } from './notificaciones.service';
import { API } from '../../../core/config/apis';
import { CampanaNotificacionesComponent } from '../components/campana-notificaciones/campana-notificaciones.component';

describe('Notificaciones', () => {
  afterEach(() => { vi.useRealTimers(); TestBed.resetTestingModule(); });
  it('envia las cuatro operaciones al backend configurado', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(NotificacionesService);
    const http = TestBed.inject(HttpTestingController);
    service.obtenerMias().subscribe();
    http.expectOne(API.baseUrl + API.notificaciones.mias).flush([]);
    service.contarNoLeidas().subscribe();
    http.expectOne(API.baseUrl + API.notificaciones.noLeidas).flush({ noLeidas: 0 });
    service.marcarComoLeida(9).subscribe();
    const single = http.expectOne(API.baseUrl + API.notificaciones.marcarLeida(9));
    expect(single.request.method).toBe('PATCH');
    single.flush({});
    service.marcarTodasComoLeidas().subscribe();
    const all = http.expectOne(API.baseUrl + API.notificaciones.marcarTodas);
    expect(all.request.method).toBe('PATCH');
    all.flush({ actualizadas: 0 });
    http.verify();
  });

  it('recupera el contador despues de un error y cancela al destruir', () => {
    vi.useFakeTimers();
    const contarNoLeidas = vi.fn().mockReturnValueOnce(throwError(() => new Error('red')))
      .mockReturnValue(of({ noLeidas: 4 }));
    const cdr = { markForCheck: vi.fn() };
    const component = new CampanaNotificacionesComponent(
      { contarNoLeidas } as unknown as NotificacionesService,
      {} as Router, cdr as unknown as ChangeDetectorRef,
    );
    component.ngOnInit();
    vi.advanceTimersByTime(30000);
    expect(component.noLeidas).toBe(4);
    expect(cdr.markForCheck).toHaveBeenCalled();
    component.ngOnDestroy();
    vi.advanceTimersByTime(60000);
    expect(contarNoLeidas).toHaveBeenCalledTimes(2);
  });

  it('muestra el fallo al cargar en lugar de aparentar una bandeja vacia', () => {
    const component = new CampanaNotificacionesComponent(
      { obtenerMias: () => throwError(() => new Error('red')) } as unknown as NotificacionesService,
      {} as Router, { markForCheck: vi.fn() } as unknown as ChangeDetectorRef,
    );
    component.cargarNotificaciones();
    expect(component.cargando).toBe(false);
    expect(component.error).toContain('No se pudieron cargar');
    component.ngOnDestroy();
  });
});
