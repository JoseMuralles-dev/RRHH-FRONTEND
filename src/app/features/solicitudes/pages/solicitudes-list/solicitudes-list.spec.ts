import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { SolicitudesList } from './solicitudes-list';

describe('SolicitudesList', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SolicitudesList], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthService, useValue: { getUsuarioSesion: () => ({ idUsuario: 1, idEmpleado: 10, nivelJerarquico: 1 }) } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('cancels a stale inbox request when switching to pending approvals', () => {
    const fixture = TestBed.createComponent(SolicitudesList); fixture.detectChanges();
    const old = http.expectOne('http://localhost:3000/solicitudes/mis-solicitudes');
    fixture.componentInstance.cambiarVista('pendientes');
    expect(old.cancelled).toBe(true);
    http.expectOne('http://localhost:3000/solicitudes/pendientes-aprobacion').flush([{ solicitud: { idSolicitud: 7, estado: 'PENDIENTE', idEmpleado: 10 } }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.solicitudes()[0].idSolicitud).toBe(7);
    expect(fixture.nativeElement.textContent).toContain('Empleado #10');
  });
  it('loads approved decisions, shows the current status and opens their detail', () => {
    const fixture = TestBed.createComponent(SolicitudesList); fixture.detectChanges();
    const old = http.expectOne('http://localhost:3000/solicitudes/mis-solicitudes');
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Aprobadas'))!;
    button.click();
    expect(old.cancelled).toBe(true);
    const request = http.expectOne('http://localhost:3000/solicitudes/aprobadas');
    expect(request.request.method).toBe('GET');
    request.flush([{ estado: 'APROBADA', solicitud: { idSolicitud: 7, estado: 'EN_REVISION', idEmpleado: 10 } }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Empleado #10');
    expect(fixture.nativeElement.querySelector('a[href="/solicitudes/7"]')).not.toBeNull();
    expect(fixture.componentInstance.solicitudes()[0].estado).toBe('EN_REVISION');
    fixture.componentInstance.recargar();
    http.expectOne('http://localhost:3000/solicitudes/aprobadas').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no has aprobado solicitudes');
  });
  it('distinguishes an empty inbox from connection errors and permits retry', () => {
    const fixture = TestBed.createComponent(SolicitudesList); fixture.detectChanges();
    http.expectOne('http://localhost:3000/solicitudes/mis-solicitudes').error(new ProgressEvent('error'));
    fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('No se pudo conectar');
    fixture.componentInstance.recargar();
    http.expectOne('http://localhost:3000/solicitudes/mis-solicitudes').flush([]);
    fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Todavía no tienes solicitudes');
  });
});
