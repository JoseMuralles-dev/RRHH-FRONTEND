import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('does not send an incomplete form', () => {
    component.login();
    http.expectNone(() => true);
    expect(component.loading()).toBe(false);
  });

  it('renders invalid credentials and stops loading without another click', async () => {
    component.loginForm.setValue({ correo: 'empleado', password: 'incorrecta' });
    component.login();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
    const request = http.expectOne(req => req.method === 'POST');
    request.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect(button.disabled).toBe(false);
    expect(button.textContent).not.toContain('Ingresando');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('Usuario o contraseña inválidos.');
  });

  it('prevents duplicate submissions while waiting', () => {
    component.loginForm.setValue({ correo: 'empleado', password: 'incorrecta' });
    component.login();
    component.login();
    http.expectOne(req => req.method === 'POST')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(component.loading()).toBe(false);
  });

  it('distinguishes connection failures from invalid credentials', async () => {
    component.loginForm.setValue({ correo: 'empleado', password: 'incorrecta' });
    component.login();
    http.expectOne(req => req.method === 'POST').error(new ProgressEvent('error'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('No se pudo conectar con el servidor.');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
  });
});
