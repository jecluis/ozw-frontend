import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Last30DaysKWhMeterComponent } from './last30-days-kwh-meter.component';

describe('Last30DaysKWhMeterComponent', () => {
  let component: Last30DaysKWhMeterComponent;
  let fixture: ComponentFixture<Last30DaysKWhMeterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Last30DaysKWhMeterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Last30DaysKWhMeterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
