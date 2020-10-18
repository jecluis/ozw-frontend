import { TestBed } from '@angular/core/testing';

import { LockingService } from './locking.service';

describe('LockingService', () => {
  let service: LockingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LockingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
