import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { ClientLoan } from '../../../client/models/client-loan.model';
import { ReceptionistTask, ReceptionistTaskService } from '../../services/receptionist-task.service';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './my-tasks.component.css',
  template: `
    <section class="my-tasks-page">
      <div class="my-tasks-header">
        <div>
          <p class="my-tasks-kicker">Reception Desk</p>
          <h1 class="my-tasks-title">My Tasks</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="my-tasks-loading">Loading your assigned tasks...</div>
      }

      @if (error()) {
        <div class="my-tasks-error">{{ error() }}</div>
      }

      @if (!loading() && tasks().length === 0) {
        <div class="my-tasks-empty">No tasks are currently assigned to you.</div>
      }

      @if (!loading() && tasks().length > 0) {
        <div class="my-tasks-table-wrap">
          <table class="my-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Loan ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              @for (task of tasks(); track task.taskId) {
                <tr>
                  <td>
                    <div class="my-tasks-task-name">{{ task.taskName }}</div>
                  </td>
                  <td>{{ task.loanId }}</td>
                  <td>
                    <button class="my-tasks-button" type="button" (click)="openTaskDialog(task)">
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
      <div class="my-tasks-dialog-backdrop" (click)="closeDialog()">
        <div class="my-tasks-dialog" (click)="$event.stopPropagation()">
          <div class="my-tasks-dialog-header">
            <div>
              <p class="my-tasks-dialog-kicker">Task details</p>
              <h2>{{ selectedTask()?.taskName || 'Loan task' }}</h2>
            </div>
            <button class="my-tasks-dialog-close" type="button" (click)="closeDialog()">×</button>
          </div>

          @if (dialogLoading()) {
            <div class="my-tasks-dialog-loading">Loading loan details...</div>
          }

          @if (dialogError()) {
            <div class="my-tasks-dialog-error">{{ dialogError() }}</div>
          }

          @if (!dialogLoading() && loanDetails()) {
            <div class="my-tasks-dialog-grid">
              <div class="my-tasks-field-row">
                <span>Loan ID</span>
                <strong>{{ loanDetails()?.id ?? '—' }}</strong>
              </div>
              <div class="my-tasks-field-row">
                <span>Type</span>
                <strong>{{ loanTypeLabel(loanDetails()?.type ?? null) }}</strong>
              </div>
              <div class="my-tasks-field-row">
                <span>Amount</span>
                <strong>{{ formatAmount(loanDetails()?.amount ?? null) }}</strong>
              </div>
              <div class="my-tasks-field-row">
                <span>Duration</span>
                <strong>{{ formatDuration(loanDetails()?.durationMonths ?? null) }}</strong>
              </div>
              <div class="my-tasks-field-row">
                <span>Status</span>
                <strong>{{ statusLabel(loanDetails()?.status ?? null) }}</strong>
              </div>
            </div>
          }

          <form class="my-tasks-completion-form" (ngSubmit)="completeTask()">
            <div class="my-tasks-completion-field">
              <label for="interestRate">Interest rate</label>
              <input
                id="interestRate"
                type="number"
                class="my-tasks-input"
                [(ngModel)]="interestRateInput"
                name="interestRate"
                min="0"
                step="0.01"
                placeholder="e.g. 7.5"
              />
            </div>

            <div class="my-tasks-dialog-actions">
              <button class="my-tasks-complete-button" type="submit">Complete task</button>
            </div>
          </form>

          @if (dialogMessage()) {
            <div class="my-tasks-dialog-message" [class.error]="dialogMessageType() === 'error'">
              {{ dialogMessage() }}
            </div>
          }
        </div>
      </div>
    }
  `
})
export class MyTasksComponent {
  private taskService = inject(ReceptionistTaskService);
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  tasks = signal<ReceptionistTask[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  dialogOpen = signal(false);
  dialogLoading = signal(false);
  dialogError = signal<string | null>(null);
  dialogMessage = signal('');
  dialogMessageType = signal<'success' | 'error' | ''>('');
  selectedTask = signal<ReceptionistTask | null>(null);
  loanDetails = signal<ClientLoan | null>(null);
  interestRateInput: number | null = null;

  readonly assigneeId = computed(() => this.currentUser()?.id ?? null);

  constructor() {
    effect(() => {
      const assigneeId = this.assigneeId();
      if (assigneeId != null) {
        this.loadTasks(assigneeId);
      }
    });
  }

  openTaskDialog(task: ReceptionistTask) {
    this.selectedTask.set(task);
    this.dialogOpen.set(true);
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
    this.interestRateInput = null;
    this.loanDetails.set(null);
    this.loadLoan(task.loanId);
  }

  closeDialog() {
    this.dialogOpen.set(false);
    this.selectedTask.set(null);
    this.loanDetails.set(null);
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
  }

  completeTask() {
    const task = this.selectedTask();
    const rate = Number(this.interestRateInput);

    if (!task) {
      this.setDialogMessage('Please select a task first.', 'error');
      return;
    }

    if (!rate && rate !== 0) {
      this.setDialogMessage('Please provide an interest rate value.', 'error');
      return;
    }

    this.taskService.completeTask(task.taskId, rate).subscribe({
      next: () => {
        this.setDialogMessage('Task completed successfully.', 'success');
        this.dialogOpen.set(false);
        this.selectedTask.set(null);
        this.loanDetails.set(null);
        const assigneeId = this.assigneeId();
        if (assigneeId != null) {
          this.loadTasks(assigneeId);
        }
      },
      error: () => {
        this.setDialogMessage('Unable to complete the task right now.', 'error');
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
}
