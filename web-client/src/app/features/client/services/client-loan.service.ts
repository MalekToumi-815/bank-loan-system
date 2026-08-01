import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../models/client-loan.model';

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

  getClientLoans(clientId: number): Observable<ClientLoan[]> {
    return this.http.get<ClientLoan[]>(`${this.baseUrl}credit/loans?clientId=${clientId}`);
  }

  startLoanRequest(payload: NewLoanRequest): Observable<{ message?: string; processInstanceId?: string }> {
    return this.http.post<{ message?: string; processInstanceId?: string }>(`${this.baseUrl}workflow/start`, payload);
  }
}
