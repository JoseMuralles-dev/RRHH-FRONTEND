import { Component, inject, output } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  readonly navigate = output<void>();
  readonly auth = inject(AuthService);
}
