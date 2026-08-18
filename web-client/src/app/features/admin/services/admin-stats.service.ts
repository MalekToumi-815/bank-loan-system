import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminStatsResponse } from '../models/admin-stats.model';

@Injectable({
  providedIn: 'root'
})
export class AdminStatsService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAdminStats(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.baseUrl}credit/stats/admin`);
  }
}
