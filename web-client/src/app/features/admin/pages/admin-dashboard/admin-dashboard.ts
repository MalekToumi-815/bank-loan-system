import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminStatsService } from '../../services/admin-stats.service';
import { AdminStatsResponse, PipelineStage, PortfolioByType } from '../../models/admin-stats.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserResponse } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private statsService = inject(AdminStatsService);
  private authService = inject(AuthService);

  public stats = signal<AdminStatsResponse | null>(null);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);
  public currentUser = signal<UserResponse | null>(null);
  public isRefreshing = signal<boolean>(false);

  // Computes maximum volume across active stages for relative progress bars
  public maxStageAmount = computed(() => {
    const list = this.stats()?.pipelineFunnel || [];
    if (list.length === 0) return 1;
    return Math.max(...list.map(s => s.totalAmount), 1);
  });

  // Computes total active loans count in pipeline
  public totalActivePipelineCount = computed(() => {
    const list = this.stats()?.pipelineFunnel || [];
    return list.reduce((acc, s) => acc + s.count, 0);
  });

  // Computes total portfolio approved amount for percentage breakdown
  public totalApprovedAmount = computed(() => {
    const list = this.stats()?.portfolioByType || [];
    return list.reduce((acc, item) => acc + item.approvedAmount, 0);
  });

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser.set(user);
      }
    });
    this.loadDashboardStats();
  }

  public loadDashboardStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.statsService.getAdminStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin statistics:', err);
        this.errorMessage.set('Failed to retrieve dashboard analytics. Please verify your connection.');
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  public refresh(): void {
    this.isRefreshing.set(true);
    this.loadDashboardStats();
  }

  public getStagePercent(amount: number): number {
    const max = this.maxStageAmount();
    if (max <= 0) return 0;
    return Math.min(100, Math.max(8, Math.round((amount / max) * 100)));
  }

  public getPortfolioPercent(amount: number): number {
    const total = this.totalApprovedAmount();
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  public getTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'MORTGAGE':
        return 'type-badge-blue';
      case 'PERSONAL':
        return 'type-badge-green';
      case 'AUTO':
        return 'type-badge-purple';
      case 'COMMERCIAL':
      case 'BUSINESS':
        return 'type-badge-amber';
      default:
        return 'type-badge-gray';
    }
  }

  public formatLoanType(type: string): string {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}
