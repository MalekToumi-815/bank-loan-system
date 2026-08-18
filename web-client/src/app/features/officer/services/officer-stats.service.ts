import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OfficerStatsResponse } from '../models/officer-stats.model';

@Injectable({
  providedIn: 'root'
})
export class OfficerStatsService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getOfficerStats(officerId?: number): Observable<OfficerStatsResponse> {
    let params = new HttpParams();
    if (officerId != null) {
      params = params.set('officerId', officerId.toString());
    }
    return this.http.get<OfficerStatsResponse>(`${this.baseUrl}credit/stats/officer`, { params });
  }
}
