import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../../client/models/client-loan.model';
import { UserResponse } from '../../auth/models/auth.model';

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

@Injectable({
  providedIn: 'root'
})
export class AdminLoanService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getLoans(
    status?: string,
    page: number = 0,
    size: number = 10,
    clientId?: number
  ): Observable<PaginatedLoansResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status && status.trim() !== '') {
      params = params.set('status', status.trim());
    }

    if (clientId != null) {
      params = params.set('clientId', clientId.toString());
    }

    return this.http.get<PaginatedLoansResponse>(`${this.baseUrl}credit/loans`, { params });
  }

  getAssignees(ids: (number | string)[]): Observable<UserResponse[]> {
    const validIds = ids.filter(id => id != null);
    if (validIds.length === 0) {
      return of([]);
    }
    return this.http.get<UserResponse[]>(`${this.baseUrl}account/users/ids?ids=${validIds.join(',')}`);
  }
}
