import { TestBed } from '@angular/core/testing';

import { NodesServiceService } from './nodes-service.service';

describe('NodesServiceService', () => {
  let service: NodesServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodesServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
