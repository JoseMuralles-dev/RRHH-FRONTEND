import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficaKpi } from './grafica-kpi';

describe('GraficaKpi', () => {
  let component: GraficaKpi;
  let fixture: ComponentFixture<GraficaKpi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficaKpi],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficaKpi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
