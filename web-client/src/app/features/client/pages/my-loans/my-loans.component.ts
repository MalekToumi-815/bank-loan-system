import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { ClientLoan } from '../../models/client-loan.model';
import { ClientLoanService, PaginatedLoansResponse } from '../../services/client-loan.service';
import { LoanDetailsDialogComponent } from '../../../../shared/components/loan-details-dialog/loan-details-dialog.component';
import { AmortisationComponent } from '../../../../shared/components/amortisation/amortisation.component';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, LoanDetailsDialogComponent, AmortisationComponent],
  styleUrl: './my-loans.component.css',
  template: `
    <section class="my-loans-page">
      <div class="my-loans-header">
        <div>
          <p class="my-loans-kicker">Client Workspace</p>
          <h1 class="my-loans-title">My Loans</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="my-loans-loading">
          Loading your loan requests...
        </div>
      }

      @if (error()) {
        <div class="my-loans-error">
          {{ error() }}
        </div>
      }

      <div class="my-loans-toolbar">
        <div class="my-loans-tabs" role="tablist" aria-label="Loan status filters">
          <button class="my-loans-tab" [class.active]="selectedFilter() === 'All'" type="button" (click)="selectedFilter.set('All')">All</button>
          <button class="my-loans-tab" [class.active]="selectedFilter() === 'Submitted'" type="button" (click)="selectedFilter.set('Submitted')">Submitted</button>
          <button class="my-loans-tab" [class.active]="selectedFilter() === 'Under review'" type="button" (click)="selectedFilter.set('Under review')">Under review</button>
          <button class="my-loans-tab" [class.active]="selectedFilter() === 'Approved'" type="button" (click)="selectedFilter.set('Approved')">Approved</button>
          <button class="my-loans-tab" [class.active]="selectedFilter() === 'Rejected'" type="button" (click)="selectedFilter.set('Rejected')">Rejected</button>
        </div>

        <div class="my-loans-search">
          <span class="my-loans-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search ID or type"
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
          />
        </div>
      </div>

      @if (!loading() && loans().content.length === 0) {
        <div class="my-loans-empty">
          No loan requests have been submitted yet.
        </div>
      }

      @if (!loading() && filteredLoans().length > 0) {
        <div class="my-loans-table-wrap">
          <table class="my-loans-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              @for (loan of filteredLoans(); track loan.id) {
                <tr>
                  <td>{{ loanLabel(loan) }}</td>
                  <td>{{ loanTypeLabel(loan.type) }}</td>
                  <td>{{ formatAmount(loan.amount) }}</td>
                  <td>{{ formatDate(loan.submissionDate) }}</td>
                  <td>
                    <span class="my-loans-pill {{ statusClass(loan) }}">{{ statusLabel(loan) }}</span>
                  </td>
                  <td>
                    @if (isApproved(loan) || isRejected(loan)) {
                      <button class="my-loans-details-button" type="button" (click)="openLoanDialog(loan)">Details</button>
                    }
                    @if (isApproved(loan)) {
                      <button class="my-loans-amort-button" type="button" (click)="openAmortisation(loan)">Amortisation</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="my-loans-pagination">
          <button
            type="button"
            class="my-loans-page-btn"
            [disabled]="page() === 0"
            (click)="previousPage()"
          >
            Previous
          </button>
          <span class="my-loans-page-info">
            Page {{ page() + 1 }} of {{ loans().totalPages || 1 }} ({{ loans().totalElements || 0 }} total)
          </span>
          <button
            type="button"
            class="my-loans-page-btn"
            [disabled]="page() + 1 >= (loans().totalPages || 1)"
            (click)="nextPage()"
          >
            Next
          </button>
        </div>
      }

      @if (!loading() && loans().content.length > 0 && filteredLoans().length === 0) {
        <div class="my-loans-empty">
          No matching loan requests were found.
        </div>
      }

      <app-loan-details-dialog
        [open]="detailsOpen()"
        [loan]="selectedLoan()"
        title="Loan details"
        kicker="Approved loan"
        (closed)="closeLoanDialog()"
      />

      @if (amortisationLoan()) {
        <div class="my-loans-dialog-backdrop" (click)="closeAmortisation()">
          <div class="my-loans-dialog" (click)="$event.stopPropagation()">
            <div class="my-loans-dialog-header">
              <div>
                <p class="my-loans-dialog-kicker">Loan #{{ amortisationLoan()?.id }}</p>
                <h2>Amortisation Schedule</h2>
              </div>
              <button type="button" class="my-loans-dialog-close" (click)="closeAmortisation()">×</button>
            </div>
            <div class="my-loans-dialog-body">
              <app-amortisation [loanId]="amortisationLoan()!.id"></app-amortisation>
            </div>
          </div>
        </div>
      }
    </section>
  `
})
export class MyLoansComponent {
  private loanService = inject(ClientLoanService);
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
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
  selectedFilter = signal<'All' | 'Submitted' | 'Under review' | 'Approved' | 'Rejected'>('All');
  searchTerm = signal('');
  detailsOpen = signal(false);
  selectedLoan = signal<ClientLoan | null>(null);
  amortisationLoan = signal<ClientLoan | null>(null);
  page = signal(0);
  pageSize = signal(10);

  readonly currentClientId = computed(() => this.currentUser()?.id ?? null);

  readonly filteredLoans = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.selectedFilter();

    return (this.loans().content || []).filter(loan => {
      const type = this.loanTypeLabel(loan.type).toLowerCase();
      const id = this.loanLabel(loan).toLowerCase();
      const matchesSearch = !term || id.includes(term) || type.includes(term);
      const matchesStatus = filter === 'All'
        || (filter === 'Submitted' && this.isSubmitted(loan))
        || (filter === 'Under review' && this.isUnderReview(loan))
        || (filter === 'Approved' && this.isApproved(loan))
        || (filter === 'Rejected' && this.isRejected(loan));

      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    effect(() => {
      const clientId = this.currentClientId();
      if (clientId != null) {
        this.loadLoans(clientId, this.page());
      }
    });
  }

  nextPage() {
    if (this.page() + 1 < (this.loans().totalPages || 1)) {
      this.page.update(p => p + 1);
      const clientId = this.currentClientId();
      if (clientId != null) {
        this.loadLoans(clientId, this.page());
      }
    }
  }

  previousPage() {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      const clientId = this.currentClientId();
      if (clientId != null) {
        this.loadLoans(clientId, this.page());
      }
    }
  }

  openLoanDialog(loan: ClientLoan) {
    this.selectedLoan.set(loan);
    this.detailsOpen.set(true);
  }

  closeLoanDialog() {
    this.detailsOpen.set(false);
    this.selectedLoan.set(null);
  }

  openAmortisation(loan: ClientLoan) {
    this.amortisationLoan.set(loan);
  }

  closeAmortisation() {
    this.amortisationLoan.set(null);
  }

  loanLabel(loan: ClientLoan): string {
    return `L-${loan.id ?? ''}`;
  }

  loanTypeLabel(type: string | null): string {
    if (!type) {
      return '';
    }

    return type
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  statusLabel(loan: ClientLoan): string {
    const status = loan.status?.toUpperCase() ?? '';
    if (status === 'SUBMITTED') {
      return 'Submitted';
    }
    if (status === 'UNDER_REVIEW') {
      return 'Under review';
    }
    if (status === 'APPROVED') {
      return 'Approved';
    }
    if (status === 'REJECTED') {
      return 'Rejected';
    }
    return status || 'Unknown';
  }

  statusClass(loan: ClientLoan): string {
    const status = loan.status?.toUpperCase() ?? '';
    if (status === 'APPROVED') {
      return 'accepted';
    }
    if (status === 'REJECTED') {
      return 'rejected';
    }
    return 'under-review';
  }

  private isSubmitted(loan: ClientLoan): boolean {
    return (loan.status?.toUpperCase() ?? '') === 'SUBMITTED';
  }

  private isUnderReview(loan: ClientLoan): boolean {
    return (loan.status?.toUpperCase() ?? '') === 'UNDER_REVIEW';
  }

  isApproved(loan: ClientLoan): boolean {
    return (loan.status?.toUpperCase() ?? '') === 'APPROVED';
  }

  isRejected(loan: ClientLoan): boolean {
    return (loan.status?.toUpperCase() ?? '') === 'REJECTED';
  }

  private loadLoans(clientId: number, page: number = 0) {
    this.loading.set(true);
    this.error.set(null);

    this.loanService.getClientLoans(clientId, page, this.pageSize()).subscribe({
      next: response => {
        this.loans.set(response);
      },
      error: () => {
        this.error.set('Unable to load your loan requests right now.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  formatAmount(value: number | null): string {
    if (value == null || value === 0) {
      return '';
    }

    return `${value.toLocaleString()} DT`;
  }
}
