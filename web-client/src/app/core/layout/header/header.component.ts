import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent],
  styleUrl: './header.component.css',
  template: `
    <header class="app-header h-16 bg-slate-900 border-b border-slate-800 text-white px-6 flex items-center justify-between shadow-sm">
      <!-- Left: Logo & Branding -->
      <div class="header-brand flex items-center space-x-3">
        <div class="brand-icon w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="brand-text">
          <h1 class="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Bank Loan System
          </h1>
          <p class="text-xs text-slate-400 font-medium">Enterprise Portal</p>
        </div>
      </div>

      <!-- Right: User Status & Logout -->
      <div class="header-user-section flex items-center space-x-4">
        @if (currentUser(); as user) {
          <div class="user-card flex items-center space-x-3 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
            <!-- User Avatar Initial -->
            <div class="user-avatar w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-400 flex items-center justify-center font-bold text-sm">
              {{ (user.name?.[0] || 'U').toUpperCase() }}
            </div>
            <div class="user-info flex flex-col text-right">
              <span class="user-name text-sm font-semibold text-slate-100 leading-tight">
                {{ user.name }} {{ user.surname }}
              </span>
              <span class="user-email text-xs text-slate-400">
                {{ user.email }}
              </span>
            </div>
            <!-- Role Badge -->
            <span class="role-badge ml-2 px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {{ user.role }}
            </span>
          </div>
        } @else {
          <div class="text-xs text-slate-400 italic">
            Not Authenticated
          </div>
        }

        <!-- Notification Bell -->
        <app-notification-bell />

        <!-- Logout Button -->
        <button
          (click)="onLogout()"
          class="btn-logout flex items-center space-x-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-slate-300 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
          title="Sign out of your account"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3 3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
