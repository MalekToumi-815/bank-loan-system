import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../models/client-loan.model';

export interface PaginatedLoansResponse {
  content: ClientLoan[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface NewLoanRequest {
  amount: number;
  type: 'PERSONAL_LOAN' | 'HOME_LOAN' | 'CAR_LOAN' | 'BUSINESS_LOAN' | 'STUDENT_LOAN' | 'RENOVATION_LOAN' | 'AGRICULTURAL_LOAN';
  durationMonths: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientLoanService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getClientLoans(clientId: number, page: number = 0, size: number = 10): Observable<PaginatedLoansResponse> {
    let params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedLoansResponse>(`${this.baseUrl}credit/loans`, { params });
  }

  startLoanRequest(payload: NewLoanRequest): Observable<{ message?: string; processInstanceId?: string }> {
    return this.http.post<{ message?: string; processInstanceId?: string }>(`${this.baseUrl}workflow/start`, payload);
  }
}
