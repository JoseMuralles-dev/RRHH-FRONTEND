import { API as TEST_API } from '../../core/config/apis';
﻿import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar';

describe('Nombre de la sesión', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [NavbarComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => { const http=TestBed.inject(HttpTestingController); http.match(r=>r.url.endsWith('/notificaciones/no-leidas/count')).forEach(r=>r.flush({noLeidas:0})); http.verify(); });
  it.each(['José Pérez', 'María López', 'admin@empresa.com'])('muestra el perfil %s con sus tildes', async nombre => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne((TEST_API.baseUrl + '/auth/me'))
      .flush({ nombre, correo: 'usuario@empresa.com' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(nombre);
    expect(fixture.nativeElement.textContent).not.toContain('Administrador');
  });
});
