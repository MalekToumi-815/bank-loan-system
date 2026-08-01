import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../../client/models/client-loan.model';

export interface OfficerTask {
  taskId: string;
  taskName: string;
  taskDefinitionKey: string;
  assignee: string;
  processInstanceId: string;
  loanId: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfficerTaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAssignedTasks(assigneeId: number): Observable<OfficerTask[]> {
    return this.http.get<OfficerTask[]>(`${this.baseUrl}workflow/tasks?assignee=${assigneeId}`);
  }

  getLoanById(loanId: number): Observable<ClientLoan> {
    return this.http.get<ClientLoan>(`${this.baseUrl}credit/loans/${loanId}`);
  }

  completeValidationTask(taskId: string, isValid: boolean): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}workflow/tasks/${taskId}/complete`, {
      is_valid: isValid
    });
  }

  completeRecommendationTask(taskId: string, riskScore: string, recommendation: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}workflow/tasks/${taskId}/complete`, {
      riskScore,
      recommendation
    });
  }
}
