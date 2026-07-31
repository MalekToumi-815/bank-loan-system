import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './dashboard-placeholder.component.css',
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Welcome Hero Card -->
      <div class="dashboard-hero-card p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl relative overflow-hidden">
        <!-- Ambient Decorative Blur -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Dashboard Overview</span>
            </div>
            <h2 class="hero-title text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {{ currentUser()?.name || 'User' }}!
            </h2>
            <p class="hero-subtitle text-slate-400 text-sm max-w-xl leading-relaxed">
              You are currently authenticated as a <span class="text-blue-400 font-semibold">{{ currentUser()?.role || 'Guest' }}</span>. Select options from the sidebar to manage your requests and account.
            </p>
          </div>

          @if (currentUser(); as user) {
            <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 min-w-[220px] text-right self-start md:self-auto">
              <span class="text-xs text-slate-400 font-medium block">Active Session</span>
              <span class="text-sm font-bold text-slate-100 block truncate">{{ user.email }}</span>
              <span class="mt-2 inline-block px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/30 uppercase">
                {{ user.role }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Quick Status Placeholder Cards -->
      <div class="stat-grid grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="stat-card p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="stat-card-title text-sm font-semibold text-slate-200">Loan Requests</h3>
          <p class="stat-card-desc text-xs text-slate-400">View and track status of current submitted loan applications.</p>
        </div>

        <div class="stat-card p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 class="stat-card-title text-sm font-semibold text-slate-200">Notifications</h3>
          <p class="stat-card-desc text-xs text-slate-400">Stay updated with system updates and application progress alerts.</p>
        </div>

        <div class="stat-card p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 class="stat-card-title text-sm font-semibold text-slate-200">Account Profile</h3>
          <p class="stat-card-desc text-xs text-slate-400">Manage user credentials and personal profile information.</p>
        </div>
      </div>
    </div>
  `
})
export class DashboardPlaceholderComponent {
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
}
