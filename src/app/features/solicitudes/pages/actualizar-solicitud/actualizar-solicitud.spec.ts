import { API as TEST_API } from '../../../../core/config/apis';
﻿import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/services/auth';
import { ActualizarSolicitud } from './actualizar-solicitud';
const data = { idSolicitud: 7, idEmpleado: 10, idTipoIncidencia: 1, estado: 'PENDIENTE', isActive: true, motivo: 'Descanso', fechaInicio: '2026-10-05', fechaFin: '2026-10-09', diasSolicitados: 5,
  tipoIncidencia: { idTipoIncidencia: 1, nombre: 'Vacaciones', requierePeriodo: true, descuentaVacaciones: true },
  aprobaciones: [{ idAprobacion: 1, estado: 'PENDIENTE' }] };
describe('Actualizar vacaciones', () => {
  let http: HttpTestingController;
  function abrir(estado = 'PENDIENTE') {
    TestBed.configureTestingModule({ imports: [ActualizarSolicitud], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      { provide: AuthService, useValue: { getUsuarioSesion: () => ({ idUsuario: 1, idEmpleado: 10, nivelJerarquico: 1 }) } }] });
    http = TestBed.inject(HttpTestingController); const f = TestBed.createComponent(ActualizarSolicitud);
    http.expectOne((TEST_API.baseUrl + '/solicitudes/7')).flush({ ...data, estado }); f.detectChanges(); return f;
  }
  afterEach(() => http.verify());
  it('bloquea vacaciones cerradas', () => { const f = abrir('CANCELADA'); expect(f.componentInstance.solicitud()).toBeNull(); expect(f.nativeElement.textContent).toContain('Solo puedes editar'); });
  it('precarga el formulario y envía PATCH conservando el tipo', async () => {
    const f = abrir(); await f.whenStable(); expect(f.nativeElement.querySelector('#inicio').value).toBe('2026-10-05');
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    f.componentInstance.guardar({ idTipoIncidencia: 99, motivo: 'Cambio', fechaInicio: '2026-10-05', fechaFin: '2026-10-08', diasSolicitados: 4 });
    const req = http.expectOne((TEST_API.baseUrl + '/solicitudes/7')); expect(req.request.method).toBe('PATCH'); expect(req.request.body.idTipoIncidencia).toBe(1);
    req.flush(data); expect(nav).toHaveBeenCalledWith(['/solicitudes', 7]);
  });
});
