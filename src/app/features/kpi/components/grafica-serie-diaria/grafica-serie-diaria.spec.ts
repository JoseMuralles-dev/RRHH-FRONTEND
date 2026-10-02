import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficaSerieDiaria } from './grafica-serie-diaria';

describe('GraficaSerieDiaria', () => {
  let component: GraficaSerieDiaria;
  let fixture: ComponentFixture<GraficaSerieDiaria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficaSerieDiaria],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficaSerieDiaria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
