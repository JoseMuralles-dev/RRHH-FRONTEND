import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { ExpedienteDetalle } from './expediente-detalle';
import { expediente, tipo } from '../../testing/fixtures';
import { API } from '../../../../core/config/apis';
describe('Mi expediente de solo lectura', () => {
  it('consulta el propio sin acceder a empleados y oculta todas las escrituras', async () => {
    TestBed.configureTestingModule({ imports: [ExpedienteDetalle], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
      { provide: AuthService, useValue: { getNivelJerarquico: () => 1, getUsuarioSesion: () => ({ idEmpleado: 10, nivelJerarquico: 1 }) } },
    ] });
    const http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(ExpedienteDetalle);
    http.expectOne(API.baseUrl + '/expedientes/empleado/10').flush(expediente);
    http.expectOne(API.baseUrl + '/expedientes/tipos-documento').flush([tipo]);
    http.expectNone(API.baseUrl + '/empleados/10');
    await f.whenStable();
    const content = f.nativeElement.textContent;
    expect(content).toContain('Solo lectura');
    expect(content).toContain('Descargar');
    expect(content).toContain('Previsualizar');
    expect(content).not.toContain('Subir documento');
    expect(content).not.toContain('Crear expediente');
    expect(content).not.toContain('Desactivar');
    f.componentInstance.crear(); http.expectNone(API.baseUrl + '/expedientes');
    http.verify();
  });
});