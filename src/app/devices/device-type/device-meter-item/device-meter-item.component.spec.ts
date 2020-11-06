import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceMeterItemComponent } from './device-meter-item.component';

describe('DeviceMeterItemComponent', () => {
  let component: DeviceMeterItemComponent;
  let fixture: ComponentFixture<DeviceMeterItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceMeterItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceMeterItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
