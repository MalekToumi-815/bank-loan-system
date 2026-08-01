import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../models/client-loan.model';

@Injectable({
  providedIn: 'root'
})
export class ClientLoanService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getClientLoans(clientId: number): Observable<ClientLoan[]> {
    return this.http.get<ClientLoan[]>(`${this.baseUrl}credit/loans?clientId=${clientId}`);
  }
}
