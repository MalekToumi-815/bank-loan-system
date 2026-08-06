import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../../client/models/client-loan.model';

export interface AdminTask {
  taskId: string;
  taskName: string;
  taskDefinitionKey: string;
  assignee: string;
  processInstanceId: string;
  loanId: number;
}

export interface AdminRiskAssessment {
  status: string;
  loanId: number;
  riskScore: string;
  recommendation: string;
  assessmentDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminTaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAssignedTasks(assigneeId: number): Observable<AdminTask[]> {
    return this.http.get<AdminTask[]>(`${this.baseUrl}workflow/tasks?assignee=${assigneeId}`);
  }

  getLoanById(loanId: number): Observable<ClientLoan> {
    return this.http.get<ClientLoan>(`${this.baseUrl}credit/loans/${loanId}`);
  }

  getLoanRiskById(loanId: number): Observable<AdminRiskAssessment> {
    return this.http.get<AdminRiskAssessment>(`${this.baseUrl}credit/loans/${loanId}/risk`);
  }

  completeValidationTask(taskId: string, isApproved: boolean, rejectionReason?: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}workflow/tasks/${taskId}/complete`, {
      is_approved: isApproved,
      ...(rejectionReason ? { rejectionReason } : {})
    });
  }

  completeDecisionTask(
    taskId: string,
    amount: number,
    finalDecision: string,
    durationMonths: number,
    startDate: string
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}workflow/tasks/${taskId}/complete`, {
      amount,
      finalDecision,
      durationMonths,
      startDate
    });
  }
}