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
  isRefreshing = signal(false);

  ngOnInit() {
    const user = this.currentUser();
    if (user?.id) {
      this.loadDashboardData(user.id);
    }
  }

  private loadDashboardData(clientId: number) {
    if (!this.isRefreshing()) {
      this.isLoadingStats.set(true);
      this.isLoadingLoans.set(true);
    }

    this.loanService.getLoanStats(clientId).subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isLoadingStats.set(false);
        this.checkRefreshCompletion();
      },
      error: (err) => {
        console.error('[Dashboard] Stats error:', err);
        this.isLoadingStats.set(false);
        this.checkRefreshCompletion();
      }
    });

    // Fetch a larger page so we can sort descending locally to get the newest loans
    this.loanService.getClientLoans(clientId, 0, 100).subscribe({
      next: (res) => {
        const allLoans = res.content || [];
        // Sort descending by ID to get the most recent, then take top 3
        const recent = allLoans.sort((a, b) => b.id - a.id).slice(0, 3);
        this.recentLoans.set(recent);
        this.isLoadingLoans.set(false);
        this.checkRefreshCompletion();
      },
      error: (err) => {
        console.error('[Dashboard] Loans error:', err);
        this.isLoadingLoans.set(false);
        this.checkRefreshCompletion();
      }
    });
  }

  public refresh() {
    const user = this.currentUser();
    if (user?.id) {
      this.isRefreshing.set(true);
      this.loadDashboardData(user.id);
    }
  }

  private checkRefreshCompletion() {
    if (!this.isLoadingStats() && !this.isLoadingLoans()) {
      this.isRefreshing.set(false);
    }
  }

  /** Formats loan type e.g. HOME_LOAN → Home loan */
  formatLoanType(type: string | null): string {
    if (!type) return '—';
    return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }
}
