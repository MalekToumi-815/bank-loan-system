import { Component, input, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmortisationService } from '../../services/amortisation.service';
import { AmortisationResponse, Instalment } from '../../models/amortisation.model';

@Component({
  selector: 'app-amortisation',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './amortisation.component.css',
  template: `
    <div class="amort-container">
      @if (loading()) {
        <div class="amort-state">
          <div class="amort-spinner"></div>
          <span>Loading amortisation schedule...</span>
        </div>
      } @else if (error()) {
        <div class="amort-state error">{{ error() }}</div>
      } @else if (response()) {
        <!-- Summary bar -->
        <div class="amort-summary">
          <div class="amort-summary-item">
            <span class="amort-summary-label">Start Date</span>
            <strong class="amort-summary-value">{{ response()!.startDate | date:'mediumDate' }}</strong>
          </div>
          <div class="amort-summary-item">
            <span class="amort-summary-label">End Date</span>
            <strong class="amort-summary-value">{{ response()!.endDate | date:'mediumDate' }}</strong>
          </div>
          <div class="amort-summary-item">
            <span class="amort-summary-label">Total Instalments</span>
            <strong class="amort-summary-value">{{ response()!.totalItems }}</strong>
          </div>
        </div>

        <!-- Table -->
        <div class="amort-table-wrap">
          <table class="amort-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (inst of response()!.installements; track inst.id) {
                <tr>
                  <td class="amort-id">{{ inst.id }}</td>
                  <td class="amort-date">{{ inst.dueDate | date:'mediumDate' }}</td>
                  <td class="amort-amount">{{ formatAmount(inst.amount) }}</td>
                  <td>
                    <span class="amort-badge" [ngClass]="getBadgeClass(inst.status)">
                      {{ inst.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (response()!.totalPages > 1) {
          <div class="amort-pagination">
            <button
              type="button"
              class="amort-page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(currentPage() - 1)"
            >
              ← Prev
            </button>
            <span class="amort-page-info">
              Page {{ currentPage() + 1 }} of {{ response()!.totalPages }}
            </span>
            <button
              type="button"
              class="amort-page-btn"
              [disabled]="currentPage() + 1 >= response()!.totalPages"
              (click)="goToPage(currentPage() + 1)"
            >
              Next →
            </button>
          </div>
        }
      } @else {
        <div class="amort-state empty">No amortisation schedule available.</div>
      }
    </div>
  `
})
export class AmortisationComponent {
  loanId = input.required<number>();

  private amortisationService = inject(AmortisationService);

  response = signal<AmortisationResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(0);

  constructor() {
    effect(() => {
      const id = this.loanId();
      if (id) {
        this.load(id, 0);
      }
    });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.load(this.loanId(), page);
  }

  private load(loanId: number, page: number) {
    this.loading.set(true);
    this.error.set(null);
    this.amortisationService.getAmortisation(loanId, page).subscribe({
      next: (data) => {
        this.response.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load amortisation schedule.');
        this.loading.set(false);
      }
    });
  }

  formatAmount(amount: number): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' DT';
  }

  getBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':    return 'badge-paid';
      case 'PENDING': return 'badge-pending';
      case 'LATE':    return 'badge-late';
      default:        return 'badge-default';
    }
  }
}
