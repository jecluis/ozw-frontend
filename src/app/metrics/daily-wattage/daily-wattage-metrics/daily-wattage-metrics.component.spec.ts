import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyWattageMetricsComponent } from './daily-wattage-metrics.component';

describe('DailyWattageMetricsComponent', () => {
  let component: DailyWattageMetricsComponent;
  let fixture: ComponentFixture<DailyWattageMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DailyWattageMetricsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyWattageMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
