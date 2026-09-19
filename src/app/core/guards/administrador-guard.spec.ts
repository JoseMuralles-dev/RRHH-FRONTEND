import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { administradorGuard } from './administrador-guard';
import { SidebarComponent } from '../../layout/sidebar/sidebar';

describe('Menú y acceso administrativo', () => {
  let nivel = 1;
  const auth = { isAuthenticated: () => true, getNivelJerarquico: () => nivel, getUsuarioSesion: () => null };
  beforeEach(() => TestBed.configureTestingModule({
    imports: [SidebarComponent], providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  }));
  it.each([1, 2, 3, 4])('muestra enlaces correctos para nivel %i', valor => {
    nivel = valor;
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(!!el.querySelector('a[href="/usuarios"]')).toBe(nivel === 4);
    expect(!!el.querySelector('a[href="/usuarios/nuevo"]')).toBe(nivel === 4);
    expect(!!el.querySelector('a[href="/empleados"]')).toBe(nivel >= 3);
  });
  it.each([1, 2, 3])('bloquea la ruta de usuarios al nivel %i', valor => {
    nivel = valor;
    const resultado = TestBed.runInInjectionContext(() => administradorGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(resultado).toEqual(TestBed.inject(Router).createUrlTree(['/dashboard']));
  });
  it('permite la ruta de usuarios al administrador', () => {
    nivel = 4;
    expect(TestBed.runInInjectionContext(() => administradorGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot))).toBe(true);
  });
});