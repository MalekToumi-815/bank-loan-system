import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClientLoanService, PaginatedLoansResponse } from './client-loan.service';

describe('ClientLoanService', () => {
  let service: ClientLoanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientLoanService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ClientLoanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the client loan list using the clientId query param', () => {
    const loans = [
      {
        id: 8,
        submissionDate: '2026-07-22T02:27:54.543+00:00',
        amount: 25000,
        type: 'HOME_LOAN',
        durationMonths: 50,
        interestRate: 0,
        workflowProcessInstanceId: 'f1e010e4-8574-11f1-94f3-00155d17caf2',
        status: 'SUBMITTED',
        finalDecision: null
      }
    ];

    const mockPaginatedResponse: PaginatedLoansResponse = {
      content: loans as any,
      pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false },
      last: true,
      totalPages: 1,
      totalElements: 1,
      size: 10,
      number: 0,
      first: true,
      numberOfElements: 1,
      empty: false
    };

    service.getClientLoans(2).subscribe(response => {
      expect(response.content).toHaveLength(1);
      expect(response.content[0].id).toBe(8);
    });

    const req = httpMock.expectOne(req => req.url === 'http://localhost:8083/credit/loans' && req.params.get('clientId') === '2');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockPaginatedResponse);
  });
});
