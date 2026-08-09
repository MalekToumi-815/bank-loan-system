import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpEventType } from '@angular/common/http';
import { AuthService } from '../../../auth/services/auth.service';
import { ClientLoan } from '../../../client/models/client-loan.model';
import { ReceptionistTask, ReceptionistTaskService } from '../../services/receptionist-task.service';
import { DocumentListComponent } from '../../../../shared/components/document-list/document-list.component';

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpg',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.txt'];

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentListComponent],
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

          <!-- ── Pinned header ── -->
          <div class="my-tasks-dialog-header">
            <div>
              <p class="my-tasks-dialog-kicker">Task details</p>
              <h2>{{ selectedTask()?.taskName || 'Loan task' }}</h2>
            </div>
            <button class="my-tasks-dialog-close" type="button" (click)="closeDialog()">×</button>
          </div>

          <!-- ── Scrollable body ── -->
          <div class="my-tasks-dialog-body">

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
                @if (loanDetails()?.OfficerrejectionReason) {
                  <div class="my-tasks-field-row">
                    <span>Officer rejection reason</span>
                    <strong>{{ loanDetails()?.OfficerrejectionReason }}</strong>
                  </div>
                }
              </div>
            }

            <!-- ── Document Upload Section ── -->
            <div class="my-tasks-upload-section">
              <p class="my-tasks-upload-label">Supporting documents</p>

              <!-- Available Documents -->
              @if (selectedTask()?.loanId) {
                <app-document-list [loanId]="selectedTask()!.loanId" style="display: block; margin-bottom: 1rem;"></app-document-list>
              }

              <!-- Drop zone -->
              <div
                class="my-tasks-dropzone"
                [class.dragover]="isDragging()"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave()"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <div class="my-tasks-dropzone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p class="my-tasks-dropzone-text">Drag &amp; drop files here, or <span class="my-tasks-dropzone-link">browse</span></p>
                <p class="my-tasks-dropzone-hint">PDF · PNG · JPG · JPEG · DOCX · TXT</p>
                <input
                  #fileInput
                  type="file"
                  multiple
                  [accept]="acceptAttr"
                  style="display:none"
                  (change)="onFileInputChange($event)"
                />
              </div>

              <!-- File list -->
              @if (uploadFiles().length > 0) {
                <ul class="my-tasks-file-list">
                  @for (uf of uploadFiles(); track uf.id) {
                    <li class="my-tasks-file-item">
                      <div class="my-tasks-file-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div class="my-tasks-file-info">
                        <div class="my-tasks-file-name-row">
                          <span class="my-tasks-file-name">{{ uf.file.name }}</span>
                          <span class="my-tasks-file-badge" [class]="'badge-' + uf.status">
                            {{ statusBadgeLabel(uf.status) }}
                          </span>
                          @if (uf.status === 'error') {
                            <button
                              class="my-tasks-retry-btn"
                              type="button"
                              title="Retry upload"
                              (click)="retryUpload(uf)"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                              </svg>
                            </button>
                          }
                          @if (uf.status === 'pending') {
                            <button
                              class="my-tasks-remove-btn"
                              type="button"
                              title="Remove file"
                              (click)="removeFile(uf.id)"
                            >×</button>
                          }
                        </div>
                        <div class="my-tasks-progress-track">
                          <div
                            class="my-tasks-progress-bar"
                            [class]="'bar-' + uf.status"
                            [style.width.%]="uf.progress"
                          ></div>
                        </div>
                      </div>
                    </li>
                  }
                </ul>

                @if (hasFilesToUpload()) {
                  <button
                    class="my-tasks-upload-btn"
                    type="button"
                    [disabled]="isUploading()"
                    (click)="startUpload()"
                  >
                    @if (isUploading()) {
                      <span class="my-tasks-upload-spinner"></span> Uploading…
                    } @else {
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload {{ pendingCount() }} file{{ pendingCount() !== 1 ? 's' : '' }}
                    }
                  </button>
                }
              }
            </div>
            <!-- ── End Document Upload Section ── -->

            <!-- Interest rate inside body -->
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

          </div>
          <!-- ── End scrollable body ── -->

          <!-- ── Sticky footer ── -->
          <div class="my-tasks-dialog-footer">
            @if (dialogMessage()) {
              <div class="my-tasks-dialog-message" [class.error]="dialogMessageType() === 'error'">
                {{ dialogMessage() }}
              </div>
            }
            <button class="my-tasks-complete-button" type="button" (click)="completeTask()">Complete task</button>
          </div>

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

  // Upload state
  uploadFiles = signal<UploadFile[]>([]);
  isDragging = signal(false);

  readonly acceptAttr = ACCEPTED_EXTENSIONS.join(',');

  readonly hasFilesToUpload = computed(() =>
    this.uploadFiles().some(f => f.status === 'pending' || f.status === 'error')
  );

  readonly pendingCount = computed(() =>
    this.uploadFiles().filter(f => f.status === 'pending').length
  );

  readonly isUploading = computed(() =>
    this.uploadFiles().some(f => f.status === 'uploading')
  );

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
    this.uploadFiles.set([]);
    this.isDragging.set(false);
    this.loadLoan(task.loanId);
  }

  closeDialog() {
    this.dialogOpen.set(false);
    this.selectedTask.set(null);
    this.loanDetails.set(null);
    this.dialogError.set(null);
    this.dialogMessage.set('');
    this.dialogMessageType.set('');
    this.uploadFiles.set([]);
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.addFiles(files);
    input.value = '';
  }

  private addFiles(files: File[]) {
    const valid = files.filter(f => this.isAccepted(f));
    const newEntries: UploadFile[] = valid.map(f => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    this.uploadFiles.update(prev => [...prev, ...newEntries]);
  }

  private isAccepted(file: File): boolean {
    if (ACCEPTED_TYPES.includes(file.type)) return true;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext);
  }

  // ── Upload ───────────────────────────────────────────────────────────────

  startUpload() {
    const loanId = this.selectedTask()?.loanId;
    if (loanId == null) return;

    const toUpload = this.uploadFiles().filter(f => f.status === 'pending');
    toUpload.forEach(uf => this.uploadSingle(uf, loanId));
  }

  retryUpload(uf: UploadFile) {
    const loanId = this.selectedTask()?.loanId;
    if (loanId == null) return;
    this.patchFile(uf.id, { status: 'pending', progress: 0 });
    this.uploadSingle(uf, loanId);
  }

  private uploadSingle(uf: UploadFile, loanId: number) {
    this.patchFile(uf.id, { status: 'uploading', progress: 0 });

    this.taskService.uploadDocument(loanId, uf.file).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 1;
          const progress = Math.round((event.loaded / total) * 100);
          this.patchFile(uf.id, { progress });
        } else if (event.type === HttpEventType.Response) {
          this.patchFile(uf.id, { status: 'done', progress: 100 });
        }
      },
      error: () => {
        this.patchFile(uf.id, { status: 'error', progress: 0 });
      }
    });
  }

  private patchFile(id: string, patch: Partial<UploadFile>) {
    this.uploadFiles.update(list =>
      list.map(f => f.id === id ? { ...f, ...patch } : f)
    );
  }

  removeFile(id: string) {
    this.uploadFiles.update(list => list.filter(f => f.id !== id));
  }

  statusBadgeLabel(status: UploadStatus): string {
    const map: Record<UploadStatus, string> = {
      pending: 'Pending',
      uploading: 'Uploading',
      done: 'Done',
      error: 'Failed',
    };
    return map[status];
  }

  // ── Task ─────────────────────────────────────────────────────────────────

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
        this.uploadFiles.set([]);
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
    if (!type) return '—';
    return type.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  }

  statusLabel(status: string | null): string {
    if (!status) return '—';
    return status.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  }

  formatAmount(value: number | null): string {
    if (value == null || value === 0) return '—';
    return `${value.toLocaleString()} DT`;
  }

  formatDuration(value: number | null): string {
    if (value == null || value === 0) return '—';
    return `${value} months`;
  }
}
