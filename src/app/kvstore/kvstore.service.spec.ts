import { TestBed } from '@angular/core/testing';

import { KvstoreService } from './kvstore.service';

describe('KvstoreService', () => {
  let service: KvstoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KvstoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
