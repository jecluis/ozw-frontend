import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterDetailsComponent } from './meter-details.component';

describe('MeterDetailsComponent', () => {
  let component: MeterDetailsComponent;
  let fixture: ComponentFixture<MeterDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MeterDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeterDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
