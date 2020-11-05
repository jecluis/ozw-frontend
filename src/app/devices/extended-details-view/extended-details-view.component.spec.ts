import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedDetailsViewComponent } from './extended-details-view.component';

describe('ExtendedDetailsViewComponent', () => {
  let component: ExtendedDetailsViewComponent;
  let fixture: ComponentFixture<ExtendedDetailsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtendedDetailsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtendedDetailsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
