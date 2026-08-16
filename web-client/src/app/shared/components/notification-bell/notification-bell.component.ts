import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { UserResponse } from '../../../features/auth/models/auth.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { Notification } from '../../models/notification.model';

const DISMISS_DURATION_S = 15;

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './notification-bell.component.css',
  template: `
    <!-- Bell Icon Button -->
    <div class="notification-bell-wrapper">
      <button
        class="bell-button"
        (click)="onBellClick()"
        title="Notifications"
      >
        <svg class="bell-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <!-- Badge -->
        @if (unreadCount > 0) {
          <span class="badge">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        }
      </button>

      <!-- Notification Popup -->
      @if (showPopup && activeNotification) {
        <div class="notification-popup">
          <div class="popup-content" (click)="onNotificationClick()" style="cursor: pointer;">
            <p class="popup-message">{{ activeNotification.message }}</p>
            <span class="popup-timestamp">{{ formatTimestamp(activeNotification.timestamp) }}</span>
          </div>

          <!-- Countdown dismiss button -->
          <button class="popup-dismiss" (click)="dismissPopup()" title="Dismiss">
            <svg class="countdown-ring" viewBox="0 0 32 32">
              <!-- Background track -->
              <circle class="ring-track" cx="16" cy="16" r="13" />
              <!-- Animated draining arc -->
              <circle
                class="ring-progress"
                cx="16" cy="16" r="13"
                [style.animation-duration]="dismissDuration + 's'"
              />
              <!-- X icon -->
              <line x1="10" y1="10" x2="22" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="22" y1="10" x2="10" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <span class="countdown-label">{{ countdown }}</span>
          </button>
        </div>
      }
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  // IMPORTANT: Verify that NotificationService is NOT listed in any component's providers: [] array.
  // It must be a true singleton (providedIn: 'root') so the WebSocket and the bell component share the exact same instance.
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notifSub!: Subscription;
  private authSub!: Subscription;
  private autoDismissTimer: ReturnType<typeof setInterval> | null = null;

  readonly dismissDuration = DISMISS_DURATION_S;

  unreadCount = 0;
  showPopup = false;
  activeNotification: Notification | null = null;
  currentUser: UserResponse | null = null;
  countdown = DISMISS_DURATION_S;

  ngOnInit(): void {
    // Subscribe to incoming notifications
    this.notifSub = this.notificationService.onNotification.subscribe((notification) => {
      this.handleNewNotification(notification);
    });

    // Subscribe to the global unread count
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
      this.cdr.markForCheck();
    });

    // Auto-connect/disconnect WebSocket based on auth state
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.notificationService.connect();

        // Fetch initial unread count
        this.notificationService.getUnreadCount().subscribe({
          error: (err) => console.error('[NotificationBell] Failed to fetch unread count', err)
        });
      } else {
        this.notificationService.disconnect();
      }
    });
  }

  private handleNewNotification(notification: Notification): void {
    // Replace any existing popup with the new notification
    this.clearAutoDismissTimer();
    this.activeNotification = notification;
    this.showPopup = true;
    this.countdown = DISMISS_DURATION_S;

    // Trigger UI update for new notification
    this.cdr.markForCheck();

    // Tick every second — decrement countdown and auto-dismiss at 0
    this.autoDismissTimer = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.clearAutoDismissTimer();
        this.showPopup = false;
        this.activeNotification = null;
      }

      // Trigger UI update each tick
      this.cdr.markForCheck();
    }, 1000);
  }

  dismissPopup(): void {
    this.clearAutoDismissTimer();
    this.showPopup = false;
    this.activeNotification = null;

    // Trigger UI update for manual dismissal
    this.cdr.markForCheck();
  }

  onBellClick(): void {
    // Navigate to notifications page
    this.router.navigate(['/dashboard/notifications']);
  }

  onNotificationClick(): void {
    const notification = this.activeNotification;
    this.dismissPopup();

    if (notification) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.notificationService.decrementUnreadCount();
        },
        error: (err) => console.error('[NotificationBell] Failed to mark as read', err)
      });
    }

    let targetUrl = '/dashboard';
    const role = this.currentUser?.role?.toUpperCase();

    switch (role as UserRole) {
      case UserRole.CLIENT:
        targetUrl = '/dashboard/my-loans';
        break;
      case UserRole.BANK_ADMIN:
        targetUrl = '/dashboard/admin-tasks';
        break;
      case UserRole.LOAN_OFFICER:
        targetUrl = '/dashboard/officer-tasks';
        break;
      case UserRole.BANK_RECEPTIONIST:
      default:
        targetUrl = '/dashboard/my-tasks';
        break;
    }

    // Force refresh if already on the route
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([targetUrl]);
    });
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private clearAutoDismissTimer(): void {
    if (this.autoDismissTimer) {
      clearInterval(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.clearAutoDismissTimer();
  }
}
