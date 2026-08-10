import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../auth/services/auth.service';
import { UserResponse } from '../../../auth/models/auth.model';
import { ClientLoan } from '../../../client/models/client-loan.model';
import { AdminRiskAssessment, AdminTask, AdminTaskService } from '../../services/admin-task.service';
import { DocumentListComponent } from '../../../../shared/components/document-list/document-list.component';

type TaskFilter = 'validation' | 'decision';

@Component({
  selector: 'app-admin-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentListComponent],
  styleUrl: './my-tasks.component.css',
  template: `
    <section class="admin-tasks-page">
      <div class="admin-tasks-header">
        <div>
          <p class="admin-tasks-kicker">Bank Admin Desk</p>
          <h1 class="admin-tasks-title">My Tasks</h1>
        </div>
      </div>

      <div class="admin-tasks-toolbar">
        <button class="admin-tasks-filter" [class.active]="selectedFilter() === 'validation'" type="button" (click)="selectedFilter.set('validation')">
          Validation tasks
        </button>
        <button class="admin-tasks-filter" [class.active]="selectedFilter() === 'decision'" type="button" (click)="selectedFilter.set('decision')">
          Decision tasks
        </button>
      </div>

      @if (loading()) {
        <div class="admin-tasks-loading">Loading your assigned tasks...</div>
      }

      @if (error()) {
        <div class="admin-tasks-error">{{ error() }}</div>
      }

      @if (!loading() && filteredTasks().length === 0) {
        <div class="admin-tasks-empty">No {{ selectedFilter() }} tasks are currently assigned to you.</div>
      }

      @if (!loading() && filteredTasks().length > 0) {
        <div class="admin-tasks-table-wrap">
          <table class="admin-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Loan ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              @for (task of filteredTasks(); track task.taskId) {
                <tr>
                  <td>
                    <div class="admin-tasks-task-name">{{ task.taskName }}</div>
                    <div class="admin-tasks-task-id">{{ task.taskId }}</div>
                  </td>
                  <td>{{ task.loanId }}</td>
                  <td>
                    <button class="admin-tasks-button" type="button" (click)="openTaskDialog(task)">
                      Details
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (dialogOpen()) {
      <div class="admin-tasks-dialog-backdrop" (click)="closeDialog()">
        <div class="admin-tasks-dialog" [class.admin-tasks-dialog--narrow]="selectedFilter() === 'validation'" (click)="$event.stopPropagation()">
          <div class="admin-tasks-dialog-header">
            <div>
              <p class="admin-tasks-dialog-kicker">{{ selectedFilter() === 'validation' ? 'Validation task' : 'Decision task' }}</p>
              <h2>{{ selectedTask()?.taskName || 'Loan task' }}</h2>
            </div>
            <button class="admin-tasks-dialog-close" type="button" (click)="closeDialog()">×</button>
          </div>

          <div class="admin-tasks-dialog-scrollable">
            @if (dialogLoading()) {
            <div class="admin-tasks-dialog-loading">Loading loan and risk details...</div>
          }

          @if (dialogError()) {
            <div class="admin-tasks-dialog-error">{{ dialogError() }}</div>
          }

          <div class="admin-tasks-dialog-body" [class.admin-tasks-dialog-body--full]="selectedFilter() === 'validation'">
            <div class="admin-tasks-dialog-main">
              @if (!dialogLoading() && loanDetails()) {
                <div class="admin-tasks-dialog-grid">
                  <div class="admin-tasks-field-row">
                    <span>Loan ID</span>
                    <strong>{{ loanDetails()?.id ?? '—' }}</strong>
                  </div>
                  <div class="admin-tasks-field-row">
                    <span>Type</span>
                    <strong>{{ loanTypeLabel(loanDetails()?.type ?? null) }}</strong>
                  </div>
                  <div class="admin-tasks-field-row">
                    <span>Amount</span>
                    <strong>{{ formatAmount(loanDetails()?.amount ?? null) }}</strong>
                  </div>
                  <div class="admin-tasks-field-row">
                    <span>Duration</span>
                    <strong>{{ formatDuration(loanDetails()?.durationMonths ?? null) }}</strong>
                  </div>
                  <div class="admin-tasks-field-row">
                    <span>Interest Rate</span>
                    <strong>{{ formatInterestRate(loanDetails()?.interestRate ?? null) }}</strong>
                  </div>
                  <div class="admin-tasks-field-row">
                    <span>Status</span>
                    <strong>{{ statusLabel(loanDetails()?.status ?? null) }}</strong>
                  </div>
                </div>
              }

              @if (!dialogLoading() && selectedTask()?.loanId) {
                <div class="admin-tasks-risk-card" style="margin-top: 12px;">
                  <div class="admin-tasks-risk-card-title">Supporting documents</div>
                  <app-document-list [loanId]="selectedTask()!.loanId" style="display: block;"></app-document-list>
                </div>
              }

              @if (!dialogLoading() && loanDetails()) {
                <div class="admin-tasks-risk-card" style="margin-top: 12px;">
                  <div class="admin-tasks-risk-card-title">Assignees</div>
                  <div class="admin-tasks-risk-grid">
                    <div class="admin-tasks-risk-row">
                      <span>Receptionist</span>
                      <strong>{{ formatAssignee(assigneeDetails().receptionist) }}</strong>
                    </div>
                    <div class="admin-tasks-risk-row">
                      <span>Credit officer</span>
                      <strong>{{ formatAssignee(assigneeDetails().creditOfficer) }}</strong>
                    </div>
                    <div class="admin-tasks-risk-row">
                      <span>Bank admin</span>
                      <strong>{{ formatAssignee(assigneeDetails().bankAdmin) }}</strong>
                    </div>
                  </div>
                </div>
              }

              @if (!dialogLoading() && riskAssessment()) {
                <div class="admin-tasks-risk-card">
                  <div class="admin-tasks-risk-card-title">Risk assessment</div>
                  <div class="admin-tasks-risk-grid">
                    <div class="admin-tasks-risk-row">
                      <span>Risk Score</span>
                      <strong>{{ riskAssessment()?.riskScore || '—' }}</strong>
                    </div>
                    <div class="admin-tasks-risk-row">
                      <span>Assessment Date</span>
                      <strong>{{ formatAssessmentDate(riskAssessment()?.assessmentDate ?? null) }}</strong>
                    </div>
                  </div>
                  <div class="admin-tasks-risk-recommendation">
                    <span>Recommendation</span>
                    <p>{{ riskAssessment()?.recommendation || '—' }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="admin-tasks-dialog-side">
              @if (selectedFilter() === 'decision') {
                <div class="admin-tasks-task-panel">
                  <div class="admin-tasks-task-panel-title">Decision inputs</div>
                  <div class="admin-tasks-form-grid">
                    <div class="admin-tasks-form-field">
                      <label class="admin-tasks-form-label" for="amount">Amount</label>
                      <input
                        id="amount"
                        type="number"
                        class="admin-tasks-input"
                        [(ngModel)]="amountInput"
                        name="amount"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 25000"
                      />
                    </div>

                    <div class="admin-tasks-form-field">
                      <label class="admin-tasks-form-label" for="finalDecision">Final decision</label>
                      <input
                        id="finalDecision"
                        type="text"
                        class="admin-tasks-input"
                        [(ngModel)]="finalDecisionInput"
                        name="finalDecision"
                        placeholder="e.g. APPROVED"
                      />
                    </div>

                    <div class="admin-tasks-form-field">
                      <label class="admin-tasks-form-label" for="durationMonths">Duration months</label>
                      <input
                        id="durationMonths"
                        type="number"
                        class="admin-tasks-input"
                        [(ngModel)]="durationMonthsInput"
                        name="durationMonths"
                        min="1"
                        step="1"
                        placeholder="e.g. 24"
                      />
                    </div>

                    <div class="admin-tasks-form-field">
                      <label class="admin-tasks-form-label" for="startDate">Start date</label>
                      <input
                        id="startDate"
                        type="date"
                        class="admin-tasks-input"
                        [(ngModel)]="startDateInput"
                        name="startDate"
                      />
                    </div>
                  </div>
                </div>
              }

              @if (selectedFilter() === 'decision') {
                <div class="admin-tasks-task-panel admin-tasks-task-panel-actions">
                  <div class="admin-tasks-task-panel-title">Task actions</div>
                  <div class="admin-tasks-dialog-actions">
                    <button class="admin-tasks-complete-button" type="button" (click)="completeDecisionTask()">Complete task</button>
                  </div>
                </div>
              }
            </div>
          </div>

          @if (dialogMessage()) {
            <div class="admin-tasks-dialog-message" [class.error]="dialogMessageType() === 'error'">
              {{ dialogMessage() }}
            </div>
          }
        </div>

        @if (selectedFilter() === 'validation') {
          <div class="admin-tasks-dialog-footer">
            <div class="admin-tasks-dialog-actions">
              <button class="admin-tasks-accept-button" type="button" (click)="completeValidationTask(true)">Approve</button>
              <button class="admin-tasks-reject-button" type="button" (click)="showRejectionReasonInput.set(true)">Reject</button>
            </div>

            @if (showRejectionReasonInput()) {
              <div class="admin-tasks-form-grid" style="margin-top: 12px;">
                <div class="admin-tasks-form-field" style="grid-column: 1 / -1;">
                  <label class="admin-tasks-form-label" for="admin-rejection-reason">Rejection reason</label>
                  <textarea
                    id="admin-rejection-reason"
                    class="admin-tasks-input"
                    rows="4"
                    [(ngModel)]="rejectionReasonInput"
                    name="rejectionReason"
                    placeholder="Enter the reason for rejecting this loan"
                  ></textarea>
                </div>
                <div class="admin-tasks-form-field" style="grid-column: 1 / -1;">
                  <button class="admin-tasks-complete-button" type="button" (click)="submitRejection()">Submit rejection</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  }
`
})
export class AdminMyTasksComponent {
  private taskService = inject(AdminTaskService);
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  tasks = signal<AdminTask[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedFilter = signal<TaskFilter>('validation');
  dialogOpen = signal(false);
  dialogLoading = signal(false);
  dialogError = signal<string | null>(null);
  dialogMessage = signal('');
  dialogMessageType = signal<'success' | 'error' | ''>('');
  selectedTask = signal<AdminTask | null>(null);
  loanDetails = signal<ClientLoan | null>(null);
  riskAssessment = signal<AdminRiskAssessment | null>(null);
  assigneeDetails = signal<{ receptionist: UserResponse | null; creditOfficer: UserResponse | null; bankAdmin: UserResponse | null }>({
    receptionist: null,
    creditOfficer: null,
    bankAdmin: null
  });
  amountInput: number | null = null;
  finalDecisionInput = '';
  durationMonthsInput: number | null = null;
  startDateInput = '';
  rejectionReasonInput = '';
  showRejectionReasonInput = signal(false);

  readonly assigneeId = computed(() => this.currentUser()?.id ?? null);
  readonly filteredTasks = computed(() => {
    const filter = this.selectedFilter();
    return this.tasks().filter(task => {
      const combined = `${task.taskName} ${task.taskDefinitionKey}`.toLowerCase();
      if (filter === 'validation') {
        return combined.includes('validate') || combined.includes('approval');
      }

      return combined.includes('decision');
    });
  });

  constructor() {
    effect(() => {
      const assigneeId = this.assigneeId();
      if (assigneeId != null) {
        this.loadTasks(assigneeId);
      }
    });
  }

  openTaskDialog(task: AdminTask) {
    this.selectedTask.set(task);
    this.dialogOpen.set(true);
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
    this.loanDetails.set(null);
    this.riskAssessment.set(null);
    this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
    this.amountInput = null;
    this.finalDecisionInput = '';
    this.durationMonthsInput = null;
    this.startDateInput = '';
    this.rejectionReasonInput = '';
    this.showRejectionReasonInput.set(false);
    this.loadTaskDetails(task.loanId);
  }

  closeDialog() {
    this.dialogOpen.set(false);
    this.selectedTask.set(null);
    this.loanDetails.set(null);
    this.riskAssessment.set(null);
    this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
    this.amountInput = null;
    this.finalDecisionInput = '';
    this.durationMonthsInput = null;
    this.startDateInput = '';
    this.rejectionReasonInput = '';
    this.showRejectionReasonInput.set(false);
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
  }

  completeValidationTask(isApproved: boolean) {
    const task = this.selectedTask();
    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!isApproved) {
      this.showRejectionReasonInput.set(true);
      return;
    }

    this.taskService.completeValidationTask(task.taskId, true).subscribe({
      next: () => {
        this.setDialogMessage('Task approved successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        this.riskAssessment.set(null);
        this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
        this.rejectionReasonInput = '';
        this.showRejectionReasonInput.set(false);
        const assigneeId = this.assigneeId();
        if (assigneeId != null) {
          this.loadTasks(assigneeId);
        }
      },
      error: () => {
        this.setDialogMessage('Unable to complete the validation task right now.', 'error');
      }
    });
  }

  submitRejection() {
    const task = this.selectedTask();
    const reason = this.rejectionReasonInput.trim();

    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!reason) {
      this.setDialogMessage('Please provide a rejection reason before submitting.', 'error');
      return;
    }

    this.taskService.completeValidationTask(task.taskId, false, reason).subscribe({
      next: () => {
        this.setDialogMessage('Task rejected successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        this.riskAssessment.set(null);
        this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
        this.rejectionReasonInput = '';
        this.showRejectionReasonInput.set(false);
        const assigneeId = this.assigneeId();
        if (assigneeId != null) {
          this.loadTasks(assigneeId);
        }
      },
      error: () => {
        this.setDialogMessage('Unable to complete the validation task right now.', 'error');
      }
    });
  }

  completeDecisionTask() {
    const task = this.selectedTask();
    const amount = Number(this.amountInput);
    const finalDecision = this.finalDecisionInput.trim();
    const durationMonths = Number(this.durationMonthsInput);
    const startDate = this.startDateInput;

    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!amount && amount !== 0) {
      this.setDialogMessage('Please provide an amount.', 'error');
      return;
    }

    if (!finalDecision) {
      this.setDialogMessage('Please provide a final decision.', 'error');
      return;
    }

    if (!durationMonths && durationMonths !== 0) {
      this.setDialogMessage('Please provide a duration in months.', 'error');
      return;
    }

    if (!startDate) {
      this.setDialogMessage('Please provide a start date.', 'error');
      return;
    }

    this.taskService.completeDecisionTask(task.taskId, amount, finalDecision, durationMonths, startDate).subscribe({
      next: () => {
        this.setDialogMessage('Decision task completed successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        this.riskAssessment.set(null);
        this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
        this.amountInput = null;
        this.finalDecisionInput = '';
        this.durationMonthsInput = null;
        this.startDateInput = '';
        const assigneeId = this.assigneeId();
        if (assigneeId != null) {
          this.loadTasks(assigneeId);
        }
      },
      error: () => {
        this.setDialogMessage('Unable to complete the decision task right now.', 'error');
      }
    });
  }

  private loadTasks(assigneeId: number) {
    this.loading.set(true);
    this.error.set(null);

    this.taskService.getAssignedTasks(assigneeId).subscribe({
      next: response => {
        this.tasks.set(response);
      },
      error: () => {
        this.error.set('Unable to load your assigned tasks right now.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  private loadTaskDetails(loanId: number) {
    this.dialogLoading.set(true);
    this.dialogError.set(null);

    forkJoin({
      loan: this.taskService.getLoanById(loanId),
      riskAssessment: this.taskService.getLoanRiskById(loanId)
    }).subscribe({
      next: response => {
        this.loanDetails.set(response.loan);
        this.riskAssessment.set(response.riskAssessment);
        this.loadAssigneeDetails(response.loan);
      },
      error: () => {
        this.dialogError.set('Unable to load the selected loan and risk details.');
      },
      complete: () => {
        this.dialogLoading.set(false);
      }
    });
  }

  private loadAssigneeDetails(loan: ClientLoan) {
    const ids: number[] = [];
    if (loan.receptionistId != null) ids.push(loan.receptionistId);
    if (loan.creditOfficerId != null) ids.push(loan.creditOfficerId);
    if (loan.bankAdminId != null) ids.push(loan.bankAdminId);

    if (ids.length === 0) {
      this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
      return;
    }

    this.taskService.getUsersByIds(ids).subscribe({
      next: users => {
        const userMap = new Map<number, UserResponse>(users.map(u => [u.id, u]));
        this.assigneeDetails.set({
          receptionist: loan.receptionistId != null ? userMap.get(loan.receptionistId) ?? null : null,
          creditOfficer: loan.creditOfficerId != null ? userMap.get(loan.creditOfficerId) ?? null : null,
          bankAdmin: loan.bankAdminId != null ? userMap.get(loan.bankAdminId) ?? null : null
        });
      },
      error: () => {
        this.assigneeDetails.set({ receptionist: null, creditOfficer: null, bankAdmin: null });
      }
    });
  }

  private setDialogMessage(message: string, type: 'success' | 'error') {
    this.dialogMessage.set(message);
    this.dialogMessageType.set(type);
  }

  formatAssignee(user: UserResponse | null): string {
    if (!user) {
      return 'Unassigned';
    }

    return `${user.name} ${user.surname} (ID: ${user.id})`;
  }

  loanTypeLabel(type: string | null): string {
    if (!type) {
      return '—';
    }

    return type
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  statusLabel(status: string | null): string {
    if (!status) {
      return '—';
    }

    return status
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  formatAmount(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }

    return `${value.toLocaleString()} DT`;
  }

  formatDuration(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }

    return `${value} months`;
  }

  formatInterestRate(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }

    return `${value}%`;
  }

  formatAssessmentDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  }
}