import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar';

describe('Nombre de la sesión', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [NavbarComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each(['José Pérez', 'María López', 'admin@empresa.com'])('muestra el perfil %s con sus tildes', async nombre => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('http://localhost:3000/auth/me')
      .flush({ nombre, correo: 'usuario@empresa.com' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(nombre);
    expect(fixture.nativeElement.textContent).not.toContain('Administrador');
  });
});
