import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientLoan } from '../../client/models/client-loan.model';

export interface ReceptionistTask {
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
export class ReceptionistTaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAssignedTasks(assigneeId: number): Observable<ReceptionistTask[]> {
    return this.http.get<ReceptionistTask[]>(`${this.baseUrl}workflow/tasks?assignee=${assigneeId}`);
  }

  getLoanById(loanId: number): Observable<ClientLoan> {
    return this.http.get<ClientLoan>(`${this.baseUrl}credit/loans/${loanId}`);
  }

  completeTask(taskId: string, interestRate: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}workflow/tasks/${taskId}/complete`, {
      interestRate
    });
  }
}
