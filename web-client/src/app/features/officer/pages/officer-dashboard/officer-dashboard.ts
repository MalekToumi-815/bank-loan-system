import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OfficerStatsService } from '../../services/officer-stats.service';
import { OfficerStatsResponse } from '../../models/officer-stats.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserResponse } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './officer-dashboard.html',
  styleUrl: './officer-dashboard.css',
})
export class OfficerDashboard implements OnInit {
  private statsService = inject(OfficerStatsService);
  private authService = inject(AuthService);

  public stats = signal<OfficerStatsResponse | null>(null);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);
  public currentUser = signal<UserResponse | null>(null);
  public isRefreshing = signal<boolean>(false);

  // Computes active queue load
  public activeQueueLoad = computed(() => {
    const queue = this.stats()?.queue;
    if (!queue) return 0;
    return queue.pendingValidation + queue.pendingRecommendation;
  });

  // Computes maximum count among risk distribution for scaling the bar chart
  public maxRiskCount = computed(() => {
    const list = this.stats()?.riskDistribution || [];
    if (list.length === 0) return 1;
    return Math.max(...list.map(s => s.count), 1);
  });

  // Computes total evaluated for risk
  public totalRiskEvaluated = computed(() => {
    const list = this.stats()?.riskDistribution || [];
    return list.reduce((acc, item) => acc + item.count, 0);
  });

  // For the SVG Donut chart representing Validation Rate vs Return Rate
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

    const userId = this.currentUser()?.id;

    this.statsService.getOfficerStats(userId).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        console.error('Failed to load officer statistics:', err);
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

  public getRiskCountPercent(count: number): number {
    const total = this.totalRiskEvaluated();
    if (total <= 0) return 0;
    return Math.round((count / total) * 100);
  }

  public getRiskBarPercent(count: number): number {
    const max = this.maxRiskCount();
    if (max <= 0) return 0;
    return Math.min(100, Math.max(8, Math.round((count / max) * 100)));
  }

  public getRiskBadgeClass(risk: string): string {
    switch (risk?.toUpperCase()) {
      case 'LOW':
        return 'type-badge-green';
      case 'MEDIUM':
        return 'type-badge-amber';
      case 'HIGH':
        return 'type-badge-red';
      default:
        return 'type-badge-gray';
    }
  }

  public formatRiskType(type: string): string {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  // Calculate SVG stroke-dashoffset for the Validation Donut Chart
  public getDonutOffset(percent: number): number {
    return this.donutCircumference - (percent / 100) * this.donutCircumference;
  }
}
