import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AmortisationResponse } from '../models/amortisation.model';

@Injectable({
  providedIn: 'root'
})
export class AmortisationService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAmortisation(loanId: number, page: number): Observable<AmortisationResponse> {
    return this.http.get<AmortisationResponse>(
      `${this.baseUrl}credit/loans/${loanId}/ammortisation?pageNumber=${page}`
    );
  }
}
