import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { ClientLoan } from '../../../client/models/client-loan.model';
import { OfficerTask, OfficerTaskService } from '../../services/officer-task.service';
import { DocumentListComponent } from '../../../../shared/components/document-list/document-list.component';

type TaskFilter = 'validation' | 'recommendation';
type RiskScore = 'ONE' | 'TWO' | 'THREE' | 'FOUR';

@Component({
  selector: 'app-officer-my-tasks',
  standalone: true,
  imports: [CommonModule, DocumentListComponent],
  styleUrl: './my-tasks.component.css',
  template: `
    <section class="officer-tasks-page">
      <div class="officer-tasks-header">
        <div>
          <p class="officer-tasks-kicker">Loan Officer Desk</p>
          <h1 class="officer-tasks-title">My Tasks</h1>
        </div>
      </div>

      <div class="officer-tasks-toolbar">
        <button class="officer-tasks-filter" [class.active]="selectedFilter() === 'validation'" type="button" (click)="selectedFilter.set('validation')">
          Validation tasks
        </button>
        <button class="officer-tasks-filter" [class.active]="selectedFilter() === 'recommendation'" type="button" (click)="selectedFilter.set('recommendation')">
          Recommendation tasks
        </button>
      </div>

      @if (loading()) {
        <div class="officer-tasks-loading">Loading your assigned tasks...</div>
      }

      @if (error()) {
        <div class="officer-tasks-error">{{ error() }}</div>
      }

      @if (!loading() && filteredTasks().length === 0) {
        <div class="officer-tasks-empty">No {{ selectedFilter() }} tasks are currently assigned to you.</div>
      }

      @if (!loading() && filteredTasks().length > 0) {
        <div class="officer-tasks-table-wrap">
          <table class="officer-tasks-table">
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
                    <div class="officer-tasks-task-name">{{ task.taskName }}</div>
                    <div class="officer-tasks-task-id">{{ task.taskId }}</div>
                  </td>
                  <td>{{ task.loanId }}</td>
                  <td>
                    <button class="officer-tasks-button" type="button" (click)="openTaskDialog(task)">
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
      <div class="officer-tasks-dialog-backdrop" (click)="closeDialog()">
        <div class="officer-tasks-dialog" (click)="$event.stopPropagation()">
          <div class="officer-tasks-dialog-header">
            <div>
              <p class="officer-tasks-dialog-kicker">{{ selectedFilter() === 'validation' ? 'Validation task' : 'Recommendation task' }}</p>
              <h2>{{ selectedTask()?.taskName || 'Loan task' }}</h2>
            </div>
            <button class="officer-tasks-dialog-close" type="button" (click)="closeDialog()">×</button>
          </div>

          <div class="officer-tasks-dialog-body">
            @if (dialogLoading()) {
            <div class="officer-tasks-dialog-loading">Loading loan details...</div>
          }

          @if (dialogError()) {
            <div class="officer-tasks-dialog-error">{{ dialogError() }}</div>
          }

          @if (!dialogLoading() && loanDetails()) {
            <div class="officer-tasks-dialog-grid">
              <div class="officer-tasks-field-row">
                <span>Loan ID</span>
                <strong>{{ loanDetails()?.id ?? '—' }}</strong>
              </div>
              <div class="officer-tasks-field-row">
                <span>Type</span>
                <strong>{{ loanTypeLabel(loanDetails()?.type ?? null) }}</strong>
              </div>
              <div class="officer-tasks-field-row">
                <span>Amount</span>
                <strong>{{ formatAmount(loanDetails()?.amount ?? null) }}</strong>
              </div>
              <div class="officer-tasks-field-row">
                <span>Duration</span>
                <strong>{{ formatDuration(loanDetails()?.durationMonths ?? null) }}</strong>
              </div>
              <div class="officer-tasks-field-row">
                <span>Interest Rate</span>
                <strong>{{ formatInterestRate(loanDetails()?.interestRate ?? null) }}</strong>
              </div>
              <div class="officer-tasks-field-row">
                <span>Status</span>
                <strong>{{ statusLabel(loanDetails()?.status ?? null) }}</strong>
              </div>
            </div>
          }

          @if (!dialogLoading() && selectedTask()?.loanId) {
            <div style="margin-top: 1.1rem;">
              <p style="margin: 0 0 0.55rem; font-size: 0.9rem; font-weight: 700; color: #334155;">Supporting documents</p>
              <app-document-list [loanId]="selectedTask()!.loanId" style="display: block; margin-bottom: 1rem;"></app-document-list>
            </div>
          }

          @if (selectedFilter() === 'recommendation') {
            <div class="officer-tasks-form-wrap">
              <label class="officer-tasks-form-label" for="recommendation-text">Recommendation</label>
              <textarea
                id="recommendation-text"
                class="officer-tasks-textarea"
                rows="4"
                [value]="recommendationText()"
                (input)="recommendationText.set($any($event.target).value)">
              </textarea>

              <label class="officer-tasks-form-label" for="risk-score-select">Risk Score</label>
              <select
                id="risk-score-select"
                class="officer-tasks-select"
                [value]="riskScore()"
                (change)="riskScore.set($any($event.target).value)">
                <option value="">Select risk score</option>
                @for (score of riskScoreOptions; track score) {
                  <option [value]="score">{{ score }}</option>
                }
              </select>
            </div>
          }

          </div>

          <div class="officer-tasks-dialog-footer">
            <div class="officer-tasks-dialog-actions">
              @if (selectedFilter() === 'validation') {
                <button class="officer-tasks-accept-button" type="button" (click)="completeValidationTask(true)">Validate</button>
                <button class="officer-tasks-reject-button" type="button" (click)="showRejectionReasonInput.set(true)">Reject</button>
              } @else {
                <button class="officer-tasks-complete-button" type="button" (click)="completeRecommendationTask()">Complete task</button>
              }
            </div>

            @if (selectedFilter() === 'validation' && showRejectionReasonInput()) {
              <div class="officer-tasks-form-wrap">
                <label class="officer-tasks-form-label" for="rejection-reason">Rejection reason</label>
                <textarea
                  id="rejection-reason"
                  class="officer-tasks-textarea"
                  rows="4"
                  [value]="rejectionReason()"
                  (input)="rejectionReason.set($any($event.target).value)">
                </textarea>

                <button class="officer-tasks-complete-button" type="button" (click)="submitRejection()">Submit rejection</button>
              </div>
            }

            @if (dialogMessage()) {
              <div class="officer-tasks-dialog-message" [class.error]="dialogMessageType() === 'error'">
                {{ dialogMessage() }}
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class OfficerMyTasksComponent {
  private taskService = inject(OfficerTaskService);
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  tasks = signal<OfficerTask[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedFilter = signal<TaskFilter>('validation');
  dialogOpen = signal(false);
  dialogLoading = signal(false);
  dialogError = signal<string | null>(null);
  dialogMessage = signal('');
  dialogMessageType = signal<'success' | 'error' | ''>('');
  selectedTask = signal<OfficerTask | null>(null);
  loanDetails = signal<ClientLoan | null>(null);
  recommendationText = signal('');
  riskScore = signal<RiskScore | ''>('');
  rejectionReason = signal('');
  showRejectionReasonInput = signal(false);
  readonly riskScoreOptions: RiskScore[] = ['ONE', 'TWO', 'THREE', 'FOUR'];

  readonly assigneeId = computed(() => this.currentUser()?.id ?? null);
  readonly filteredTasks = computed(() => {
    const filter = this.selectedFilter();
    return this.tasks().filter(task => {
      const combined = `${task.taskName} ${task.taskDefinitionKey}`.toLowerCase();
      if (filter === 'validation') {
        return combined.includes('validate') || combined.includes('validates');
      }

      return combined.includes('recommend') || combined.includes('recommendation');
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

  openTaskDialog(task: OfficerTask) {
    this.selectedTask.set(task);
    this.dialogOpen.set(true);
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
    this.loanDetails.set(null);
    this.rejectionReason.set('');
    this.showRejectionReasonInput.set(false);
    this.loadLoan(task.loanId);
  }

  closeDialog() {
    this.dialogOpen.set(false);
    this.selectedTask.set(null);
    this.loanDetails.set(null);
    this.recommendationText.set('');
    this.riskScore.set('');
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
    this.rejectionReason.set('');
    this.showRejectionReasonInput.set(false);
  }

  completeRecommendationTask() {
    const task = this.selectedTask();
    const recommendation = this.recommendationText().trim();
    const riskScore = this.riskScore();

    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!recommendation) {
      this.setDialogMessage('Please enter a recommendation before completing the task.', 'error');
      return;
    }

    if (!riskScore) {
      this.setDialogMessage('Please select a risk score before completing the task.', 'error');
      return;
    }

    this.taskService.completeRecommendationTask(task.taskId, riskScore, recommendation).subscribe({
      next: () => {
        this.setDialogMessage('Recommendation task completed successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        this.recommendationText.set('');
        this.riskScore.set('');
        const assigneeId = this.assigneeId();
        if (assigneeId != null) {
          this.loadTasks(assigneeId);
        }
      },
      error: () => {
        this.setDialogMessage('Unable to complete the recommendation task right now.', 'error');
      }
    });
  }

  completeValidationTask(isValid: boolean) {
    const task = this.selectedTask();
    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!isValid) {
      this.showRejectionReasonInput.set(true);
      return;
    }

    this.taskService.completeValidationTask_true(task.taskId, true).subscribe({
      next: () => {
        this.setDialogMessage('Task validated successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        this.rejectionReason.set('');
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
    const reason = this.rejectionReason().trim();

    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!reason) {
      this.setDialogMessage('Please provide a rejection reason before submitting.', 'error');
      return;
    }

    this.taskService.completeValidationTask_false(task.taskId, false, reason).subscribe({
      next: () => {
        this.setDialogMessage('Task rejected successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        this.rejectionReason.set('');
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

  private loadLoan(loanId: number) {
    this.dialogLoading.set(true);
    this.dialogError.set(null);

    this.taskService.getLoanById(loanId).subscribe({
      next: response => {
        this.loanDetails.set(response);
      },
      error: () => {
        this.dialogError.set('Unable to load the selected loan details.');
      },
      complete: () => {
        this.dialogLoading.set(false);
      }
    });
  }

  private setDialogMessage(message: string, type: 'success' | 'error') {
    this.dialogMessage.set(message);
    this.dialogMessageType.set(type);
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
}
