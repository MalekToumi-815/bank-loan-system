import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { ClientLoanService, LoanStatsResponse } from '../../services/client-loan.service';
import { ClientLoan } from '../../models/client-loan.model';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css',
})
export class ClientDashboard implements OnInit {
  private authService = inject(AuthService);
  private loanService = inject(ClientLoanService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  // Writable signals so Angular re-renders automatically when HTTP data arrives
  stats = signal<LoanStatsResponse | null>(null);
  recentLoans = signal<ClientLoan[]>([]);
  isLoadingStats = signal(true);
  isLoadingLoans = signal(true);

  ngOnInit() {
    const user = this.currentUser();
    if (user?.id) {
      this.loadDashboardData(user.id);
    }
  }

  private loadDashboardData(clientId: number) {
    this.loanService.getLoanStats(clientId).subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isLoadingStats.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Stats error:', err);
        this.isLoadingStats.set(false);
      }
    });

    this.loanService.getClientLoans(clientId, 0, 3).subscribe({
      next: (res) => {
        this.recentLoans.set(res.content || []);
        this.isLoadingLoans.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Loans error:', err);
        this.isLoadingLoans.set(false);
      }
    });
  }

  /** Formats loan type e.g. HOME_LOAN → Home loan */
  formatLoanType(type: string | null): string {
    if (!type) return '—';
    return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }
}
