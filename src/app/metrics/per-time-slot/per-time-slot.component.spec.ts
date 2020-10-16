import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PerTimeSlotComponent } from './per-time-slot.component';

describe('PerTimeSlotComponent', () => {
  let component: PerTimeSlotComponent;
  let fixture: ComponentFixture<PerTimeSlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PerTimeSlotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PerTimeSlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
