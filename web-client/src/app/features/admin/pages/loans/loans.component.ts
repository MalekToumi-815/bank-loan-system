import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminLoanService, PaginatedLoansResponse } from '../../services/admin-loan.service';
import { ClientLoan } from '../../../client/models/client-loan.model';
import { UserResponse } from '../../../auth/models/auth.model';
import { DocumentListComponent } from '../../../../shared/components/document-list/document-list.component';
import { AmortisationComponent } from '../../../../shared/components/amortisation/amortisation.component';
import { FormatRolePipe } from '../../../../shared/pipes/format-role.pipe';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentListComponent, AmortisationComponent, FormatRolePipe],
  styleUrl: './loans.component.css',
  template: `
    <section class="admin-loans-page">
      <div class="admin-loans-header">
        <div>
          <p class="admin-loans-kicker">Bank Admin Desk</p>
          <h1 class="admin-loans-title">Loan Management</h1>
        </div>
      </div>

      <div class="admin-loans-filters">
        <label class="admin-loans-filter-field">
          <span>Status</span>
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
            <option value="">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>

        <button type="button" class="admin-loans-search-btn" (click)="applyFilters()">
          Filter
        </button>
      </div>

      @if (loading()) {
        <div class="admin-loans-state">Loading loans...</div>
      }

      @if (error()) {
        <div class="admin-loans-state admin-loans-error">{{ error() }}</div>
      }

      @if (!loading() && !error()) {
        <div class="admin-loans-table-wrap">
          <table class="admin-loans-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Workflow Task</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (loan of loans().content; track loan.id) {
                <tr>
                  <td>
                    <span class="admin-loans-id">#{{ loan.id }}</span>
                  </td>
                  <td>
                    <span class="admin-loans-type">{{ loanTypeLabel(loan.type) }}</span>
                  </td>
                  <td>
                    <span class="admin-loans-date">{{ formatDate(loan.submissionDate) }}</span>
                  </td>
                  <td>
                    <span class="admin-loans-status-badge" [ngClass]="getStatusBadgeClass(loan.status)">
                      {{ statusLabel(loan.status) }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="admin-loans-workflow-task"
                      [class.empty]="getWorkflowTaskDisplay(loan) === '-'"
                    >
                      {{ getWorkflowTaskDisplay(loan) }}
                    </span>
                  </td>
                  <td>
                    <div class="admin-loans-actions">
                      <button
                        type="button"
                        class="admin-loans-details-btn"
                        (click)="openDetails(loan)"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        class="admin-loans-assignees-btn"
                        (click)="openAssignees(loan)"
                      >
                        Assignees
                      </button>
                      @if (loan.status?.toUpperCase() === 'APPROVED') {
                        <button
                          type="button"
                          class="admin-loans-amort-btn"
                          (click)="openAmortisation(loan)"
                        >
                          Amortisation
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">
                    No loans found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="admin-loans-pagination">
          <button
            type="button"
            class="admin-loans-page-btn"
            [disabled]="page() === 0"
            (click)="previousPage()"
          >
            Previous
          </button>
          <span class="admin-loans-page-info">
            Page {{ page() + 1 }} of {{ loans().totalPages || 1 }} ({{ loans().totalElements || 0 }} total)
          </span>
          <button
            type="button"
            class="admin-loans-page-btn"
            [disabled]="page() + 1 >= (loans().totalPages || 1)"
            (click)="nextPage()"
          >
            Next
          </button>
        </div>
      }
    </section>

    @if (selectedLoanForDetails()) {
      <div class="admin-loans-dialog-backdrop" (click)="closeDetailsModal()">
        <div class="admin-loans-dialog admin-loans-details-dialog" (click)="$event.stopPropagation()">
          <div class="admin-loans-dialog-header">
            <div>
              <p class="admin-loans-dialog-kicker">Loan #{{ selectedLoanForDetails()?.id }}</p>
              <h2>Loan & Client Details</h2>
            </div>
            <button type="button" class="admin-loans-dialog-close" (click)="closeDetailsModal()">×</button>
          </div>

          <div class="admin-loans-details-content">
            <!-- Client Information -->
            <div class="admin-loans-section">
              <h3 class="admin-loans-section-title">Client Information</h3>
              @if (detailsLoading()) {
                <div class="admin-loans-state">Loading client information...</div>
              }
              @if (detailsError()) {
                <div class="admin-loans-state admin-loans-error">{{ detailsError() }}</div>
              }
              @if (!detailsLoading() && clientInfo()) {
                <div class="admin-loans-client-card">
                  <div class="admin-loans-detail-grid">
                    <div class="admin-loans-detail-item">
                      <span class="label">Client ID</span>
                      <span class="value font-mono">#{{ clientInfo()?.id }}</span>
                    </div>
                    <div class="admin-loans-detail-item">
                      <span class="label">Full Name</span>
                      <span class="value font-bold">{{ clientInfo()?.name }} {{ clientInfo()?.surname }}</span>
                    </div>
                    <div class="admin-loans-detail-item">
                      <span class="label">Email Address</span>
                      <span class="value">{{ clientInfo()?.email }}</span>
                    </div>
                    <div class="admin-loans-detail-item">
                      <span class="label">CIN</span>
                      <span class="value">{{ clientInfo()?.cin || '—' }}</span>
                    </div>
                    <div class="admin-loans-detail-item">
                      <span class="label">Phone</span>
                      <span class="value">{{ clientInfo()?.phone || '—' }}</span>
                    </div>
                  </div>
                </div>
              }
              @if (!detailsLoading() && !clientInfo() && !detailsError()) {
                <div class="admin-loans-state">No client information available (Client ID: {{ selectedLoanForDetails()?.clientId ?? 'N/A' }}).</div>
              }
            </div>

            <!-- Additional Loan Details -->
            <div class="admin-loans-section">
              <h3 class="admin-loans-section-title">Loan Specifications</h3>
              <div class="admin-loans-detail-grid">
                <div class="admin-loans-detail-item">
                  <span class="label">Loan Type</span>
                  <span class="value font-bold">{{ loanTypeLabel(selectedLoanForDetails()?.type ?? null) }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Requested Amount</span>
                  <span class="value highlight">{{ formatAmount(selectedLoanForDetails()?.amount ?? null) }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Duration</span>
                  <span class="value">{{ selectedLoanForDetails()?.durationMonths ? selectedLoanForDetails()?.durationMonths + ' months' : '—' }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Interest Rate</span>
                  <span class="value">{{ selectedLoanForDetails()?.interestRate != null ? selectedLoanForDetails()?.interestRate + '%' : '—' }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Submission Date</span>
                  <span class="value">{{ formatDate(selectedLoanForDetails()?.submissionDate ?? null) }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Start Date</span>
                  <span class="value">{{ formatDate(selectedLoanForDetails()?.startDate ?? null) }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Status</span>
                  <span class="admin-loans-status-badge" [ngClass]="getStatusBadgeClass(selectedLoanForDetails()?.status ?? null)">
                    {{ statusLabel(selectedLoanForDetails()?.status ?? null) }}
                  </span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Workflow Task</span>
                  <span class="value font-medium color-teal">{{ getWorkflowTaskDisplay(selectedLoanForDetails()!) }}</span>
                </div>
                <div class="admin-loans-detail-item">
                  <span class="label">Final Decision</span>
                  <span class="value">{{ selectedLoanForDetails()?.finalDecision || '—' }}</span>
                </div>
              </div>

              @if (selectedLoanForDetails()?.AdminrejectionReason) {
                <div class="admin-loans-rejection-box">
                  <span class="rejection-title">Admin Rejection Reason</span>
                  <p class="rejection-text">{{ selectedLoanForDetails()?.AdminrejectionReason }}</p>
                </div>
              }

              @if (selectedLoanForDetails()?.OfficerrejectionReason) {
                <div class="admin-loans-rejection-box">
                  <span class="rejection-title">Officer Rejection Reason</span>
                  <p class="rejection-text">{{ selectedLoanForDetails()?.OfficerrejectionReason }}</p>
                </div>
              }
            </div>

            @if (selectedLoanForDetails()?.id) {
              <div class="admin-loans-section" style="margin-top: 1.5rem;">
                <h3 class="admin-loans-section-title">Supporting Documents</h3>
                <app-document-list [loanId]="selectedLoanForDetails()!.id" style="display: block;"></app-document-list>
              </div>
            }
          </div>
        </div>
      </div>
    }

    @if (selectedLoanForAssignees()) {
      <div class="admin-loans-dialog-backdrop" (click)="closeAssigneesModal()">
        <div class="admin-loans-dialog" (click)="$event.stopPropagation()">
          <div class="admin-loans-dialog-header">
            <div>
              <p class="admin-loans-dialog-kicker">Loan #{{ selectedLoanForAssignees()?.id }}</p>
              <h2>Assigned Employees</h2>
            </div>
            <button type="button" class="admin-loans-dialog-close" (click)="closeAssigneesModal()">×</button>
          </div>

          @if (assigneesLoading()) {
            <div class="admin-loans-state">Loading assignees...</div>
          }

          @if (assigneesError()) {
            <div class="admin-loans-state admin-loans-error">{{ assigneesError() }}</div>
          }

          @if (!assigneesLoading() && !assigneesError()) {
            <div class="admin-loans-assignees-list">
              @for (user of assignees(); track user.id) {
                <div class="admin-loans-assignee-card">
                  <div class="admin-loans-assignee-main">
                    <span class="admin-loans-assignee-id">ID: {{ user.id }}</span>
                    <span class="admin-loans-assignee-name">{{ user.name }} {{ user.surname }}</span>
                  </div>
                  <span class="admin-loans-assignee-role">{{ user.role | formatRole }}</span>
                </div>
              } @empty {
                <div class="admin-loans-state">No assignees found for this loan.</div>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (amortisationLoan()) {
      <div class="admin-loans-dialog-backdrop" (click)="closeAmortisation()">
        <div class="admin-loans-dialog admin-loans-amort-dialog" (click)="$event.stopPropagation()">
          <div class="admin-loans-dialog-header">
            <div>
              <p class="admin-loans-dialog-kicker">Loan #{{ amortisationLoan()?.id }}</p>
              <h2>Amortisation Schedule</h2>
            </div>
            <button type="button" class="admin-loans-dialog-close" (click)="closeAmortisation()">×</button>
          </div>
          <div class="admin-loans-amort-body">
            <app-amortisation [loanId]="amortisationLoan()!.id"></app-amortisation>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminLoansComponent {
  private loanService = inject(AdminLoanService);

  loans = signal<PaginatedLoansResponse>({
    content: [],
    pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false },
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 10,
    number: 0,
    first: true,
    numberOfElements: 0,
    empty: true
  });

  loading = signal(false);
  error = signal<string | null>(null);
  page = signal(0);
  pageSize = signal(10);
  selectedStatus = '';

  selectedLoanForAssignees = signal<ClientLoan | null>(null);
  assignees = signal<UserResponse[]>([]);
  assigneesLoading = signal(false);
  assigneesError = signal<string | null>(null);

  selectedLoanForDetails = signal<ClientLoan | null>(null);
  clientInfo = signal<UserResponse | null>(null);
  detailsLoading = signal(false);
  detailsError = signal<string | null>(null);

  amortisationLoan = signal<ClientLoan | null>(null);

  constructor() {
    this.loadLoans();
  }

  loadLoans() {
    this.loading.set(true);
    this.error.set(null);

    this.loanService.getLoans(this.selectedStatus, this.page(), this.pageSize()).subscribe({
      next: response => {
        this.loans.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load loans right now.');
        this.loading.set(false);
      }
    });
  }

  openDetails(loan: ClientLoan) {
    this.selectedLoanForDetails.set(loan);
    this.detailsLoading.set(true);
    this.detailsError.set(null);
    this.clientInfo.set(null);

    if (loan.clientId == null) {
      this.detailsLoading.set(false);
      return;
    }

    this.loanService.getAssignees([loan.clientId]).subscribe({
      next: users => {
        if (users && users.length > 0) {
          this.clientInfo.set(users[0]);
        }
        this.detailsLoading.set(false);
      },
      error: () => {
        this.detailsError.set('Unable to fetch client details.');
        this.detailsLoading.set(false);
      }
    });
  }

  closeDetailsModal() {
    this.selectedLoanForDetails.set(null);
    this.clientInfo.set(null);
    this.detailsError.set(null);
    this.detailsLoading.set(false);
  }

  openAssignees(loan: ClientLoan) {
    this.selectedLoanForAssignees.set(loan);
    this.assigneesLoading.set(true);
    this.assigneesError.set(null);
    this.assignees.set([]);

    const idsToFetch = [loan.receptionistId, loan.creditOfficerId, loan.bankAdminId].filter(
      (id): id is number => id != null
    );

    if (idsToFetch.length === 0) {
      this.assigneesLoading.set(false);
      return;
    }

    this.loanService.getAssignees(idsToFetch).subscribe({
      next: users => {
        this.assignees.set(users);
        this.assigneesLoading.set(false);
      },
      error: () => {
        this.assigneesError.set('Unable to fetch assignees details.');
        this.assigneesLoading.set(false);
      }
    });
  }

  closeAssigneesModal() {
    this.selectedLoanForAssignees.set(null);
    this.assignees.set([]);
    this.assigneesError.set(null);
    this.assigneesLoading.set(false);
  }

  openAmortisation(loan: ClientLoan) {
    this.amortisationLoan.set(loan);
  }

  closeAmortisation() {
    this.amortisationLoan.set(null);
  }

  applyFilters() {
    this.page.set(0);
    this.loadLoans();
  }

  nextPage() {
    if (this.page() + 1 < (this.loans().totalPages || 1)) {
      this.page.update(p => p + 1);
      this.loadLoans();
    }
  }

  previousPage() {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      this.loadLoans();
    }
  }

  getWorkflowTaskDisplay(loan: ClientLoan): string {
    if (!loan.workflowTask || loan.workflowTask.trim() === '') {
      return '-';
    }
    return loan.workflowTask;
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

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatAmount(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }
    return `${value.toLocaleString()} DT`;
  }

  getStatusBadgeClass(status: string | null): string {
    if (!status) return 'status-default';
    const upper = status.toUpperCase();
    if (upper.includes('APPROVED')) return 'status-approved';
    if (upper.includes('REJECTED')) return 'status-rejected';
    if (upper.includes('PENDING') || upper.includes('VALIDATED')) return 'status-pending';
    return 'status-default';
  }
}
