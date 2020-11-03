import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceCapabilitiesComponent } from './device-capabilities.component';

describe('DeviceCapabilitiesComponent', () => {
  let component: DeviceCapabilitiesComponent;
  let fixture: ComponentFixture<DeviceCapabilitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceCapabilitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceCapabilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
