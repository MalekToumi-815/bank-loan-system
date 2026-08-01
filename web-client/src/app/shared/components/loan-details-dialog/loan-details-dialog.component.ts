import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClientLoan } from '../../../features/client/models/client-loan.model';

@Component({
  selector: 'app-loan-details-dialog',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './loan-details-dialog.component.css',
  template: `
    @if (open) {
      <div class="loan-details-backdrop" (click)="closed.emit()">
        <div class="loan-details-dialog" (click)="$event.stopPropagation()">
          <div class="loan-details-header">
            <div>
              <p class="loan-details-kicker">{{ kicker }}</p>
              <h2>{{ title }}</h2>
            </div>
            <button class="loan-details-close" type="button" (click)="closed.emit()">×</button>
          </div>

          <div class="loan-details-grid" [class.compact]="compact">
            <div class="loan-details-card">
              <span>Loan ID</span>
              <strong>{{ loan?.id ?? '—' }}</strong>
            </div>
            <div class="loan-details-card">
              <span>Type</span>
              <strong>{{ loanTypeLabel(loan?.type ?? null) }}</strong>
            </div>
            <div class="loan-details-card">
              <span>Amount</span>
              <strong>{{ formatAmount(loan?.amount ?? null) }}</strong>
            </div>
            <div class="loan-details-card">
              <span>Duration</span>
              <strong>{{ formatDuration(loan?.durationMonths ?? null) }}</strong>
            </div>
            <div class="loan-details-card">
              <span>Interest Rate</span>
              <strong>{{ formatPercent(loan?.interestRate ?? null) }}</strong>
            </div>
            <div class="loan-details-card">
              <span>Status</span>
              <strong>{{ statusLabel(loan?.status ?? null) }}</strong>
            </div>
            <div class="loan-details-card loan-details-card-wide">
              <span>Decision</span>
              <strong>{{ loan?.finalDecision || '—' }}</strong>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class LoanDetailsDialogComponent {
  @Input() open = false;
  @Input() loan: ClientLoan | null = null;
  @Input() title = 'Loan details';
  @Input() kicker = 'Loan overview';
  @Input() compact = false;
  @Output() closed = new EventEmitter<void>();

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

  formatPercent(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }

    return `${value}%`;
  }
}