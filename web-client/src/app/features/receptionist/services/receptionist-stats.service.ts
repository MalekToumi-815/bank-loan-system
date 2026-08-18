import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReceptionistStatsResponse } from '../models/receptionist-stats.model';

@Injectable({
  providedIn: 'root'
})
export class ReceptionistStatsService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getReceptionistStats(receptionistId?: number): Observable<ReceptionistStatsResponse> {
    let params = new HttpParams();
    if (receptionistId != null) {
      params = params.set('receptionistId', receptionistId.toString());
    }
    return this.http.get<ReceptionistStatsResponse>(`${this.baseUrl}credit/stats/receptionist`, { params });
  }
}
