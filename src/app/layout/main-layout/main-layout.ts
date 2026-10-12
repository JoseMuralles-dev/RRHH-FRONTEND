import { Component, ElementRef, HostListener, viewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar';
import { NavbarComponent } from '../navbar/navbar';
import {CampanaNotificacionesComponent} from '../../features/notificaciones/components/campana-notificaciones/campana-notificaciones.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    NavbarComponent,

  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {
  readonly menuOpen = signal(false);
  private readonly menu = viewChild<ElementRef<HTMLDialogElement>>('mobileMenu');
  private returnFocus: HTMLElement | null = null;

  openMenu(): void {
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.menuOpen.set(true);
    this.menu()?.nativeElement.showModal();
  }

  closeMenu(): void {
    this.menu()?.nativeElement.close();
    this.menuOpen.set(false);
    this.returnFocus?.focus();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.matchMedia('(min-width: 1025px)').matches && this.menuOpen()) this.closeMenu();
  }
}
