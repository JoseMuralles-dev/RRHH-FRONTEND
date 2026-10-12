import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), { provide: AuthService, useValue: { getNivelJerarquico: () => 1 } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('offers working personal destinations without management links for employees', () => {
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/solicitudes', '/vacaciones', '/kpis/mi-desempeno'
    ]);
  });

  it('shows personnel management destinations for authorized roles', () => {
    fixture.destroy();
    TestBed.inject(AuthService).getNivelJerarquico = () => 3;
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/empleados"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/expedientes"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/departamentos"]')).toBeTruthy();
  });
});
