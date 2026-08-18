import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReceptionistStatsService } from '../../services/receptionist-stats.service';
import { ReceptionistStatsResponse, LoanTypeAggregateDto } from '../../models/receptionist-stats.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserResponse } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receptionist-dashboard.html',
  styleUrl: './receptionist-dashboard.css',
})
export class ReceptionistDashboard implements OnInit {
  private statsService = inject(ReceptionistStatsService);
  private authService = inject(AuthService);

  public stats = signal<ReceptionistStatsResponse | null>(null);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);
  public currentUser = signal<UserResponse | null>(null);
  public isRefreshing = signal<boolean>(false);

  // Computes maximum volume among loan types for scaling the bar chart
  public maxTypeAmount = computed(() => {
    const list = this.stats()?.byLoanType || [];
    if (list.length === 0) return 1;
    return Math.max(...list.map(s => s.totalAmount), 1);
  });

  // Computes total capital channeled
  public totalCapitalChanneled = computed(() => {
    const list = this.stats()?.byLoanType || [];
    return list.reduce((acc, item) => acc + item.totalAmount, 0);
  });

  // For the SVG Donut chart
  public donutRadius = 45;
  public donutCircumference = 2 * Math.PI * this.donutRadius;

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

    // Assuming we fetch stats for the currently logged in receptionist
    // We could pass this.currentUser()?.id if backend specifically requires it,
    // but the backend controller might just use the logged-in context or allow generic fetch if no param passed.
    // We'll pass the ID if available.
    const userId = this.currentUser()?.id;

    this.statsService.getReceptionistStats(userId).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        console.error('Failed to load receptionist statistics:', err);
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

  public getTypePercent(amount: number): number {
    const total = this.totalCapitalChanneled();
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  public getTypeBarPercent(amount: number): number {
    const max = this.maxTypeAmount();
    if (max <= 0) return 0;
    return Math.min(100, Math.max(8, Math.round((amount / max) * 100)));
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

  // Calculate SVG stroke-dashoffset for the Donut Chart
  public getDonutOffset(percent: number): number {
    return this.donutCircumference - (percent / 100) * this.donutCircumference;
  }
}
