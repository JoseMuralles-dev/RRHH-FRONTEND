import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { API } from '../../core/config/apis';
import { MainLayoutComponent } from './main-layout';

describe('Navegación móvil', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let dialog: HTMLDialogElement;
  let toggle: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(API.baseUrl + '/auth/me')
      .flush({ nombre: 'Usuario de prueba', correo: 'prueba@example.com' });
    dialog = fixture.nativeElement.querySelector('dialog');
    toggle = fixture.nativeElement.querySelector('.menu-toggle');
    // JSDOM no implementa el comportamiento modal del navegador.
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
  });

  afterEach(() => { const http=TestBed.inject(HttpTestingController); http.match(r=>r.url.endsWith('/notificaciones/no-leidas/count')).forEach(r=>r.flush({noLeidas:0})); http.verify(); });

  it('abre desde el navbar y actualiza aria-expanded', () => {
    expect(dialog.open).toBe(false);
    toggle.click(); fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('cierra con el botón y devuelve el foco al botón de apertura', () => {
    toggle.focus(); toggle.click(); fixture.detectChanges();
    const focus = vi.spyOn(toggle, 'focus');
    fixture.nativeElement.querySelector('.menu-close').click(); fixture.detectChanges();
    expect(dialog.open).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(focus).toHaveBeenCalled();
  });

  it('cierra al cancelar con Escape o al pulsar el fondo', () => {
    toggle.click(); dialog.dispatchEvent(new Event('cancel')); fixture.detectChanges();
    expect(dialog.open).toBe(false);
    toggle.click(); dialog.click(); fixture.detectChanges();
    expect(dialog.open).toBe(false);
  });

  it('cierra al elegir una ruta existente del menú', () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    toggle.click();
    const link = dialog.querySelector('a')!;
    link.addEventListener('click', event => event.preventDefault());
    link.click(); fixture.detectChanges();
    expect(dialog.open).toBe(false);
  });

  it('cierra el overlay al volver al ancho de escritorio', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    try {
      toggle.click();
      window.dispatchEvent(new Event('resize')); fixture.detectChanges();
      expect(dialog.open).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });
});
