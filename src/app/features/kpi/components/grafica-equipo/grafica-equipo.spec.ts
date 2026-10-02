import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficaEquipo } from './grafica-equipo';

describe('GraficaEquipo', () => {
  let component: GraficaEquipo;
  let fixture: ComponentFixture<GraficaEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficaEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficaEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
