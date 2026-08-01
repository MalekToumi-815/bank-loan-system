import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { ReceptionistTask, ReceptionistTaskService } from '../../services/receptionist-task.service';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule],
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
                    <button class="my-tasks-button" type="button" [attr.data-task-id]="task.taskId">
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
  `
})
export class MyTasksComponent {
  private taskService = inject(ReceptionistTaskService);
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  tasks = signal<ReceptionistTask[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly assigneeId = computed(() => this.currentUser()?.id ?? null);

  constructor() {
    effect(() => {
      const assigneeId = this.assigneeId();
      if (assigneeId != null) {
        this.loadTasks(assigneeId);
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
}
