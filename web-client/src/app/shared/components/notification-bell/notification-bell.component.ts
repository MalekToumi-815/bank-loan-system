import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { UserResponse } from '../../../features/auth/models/auth.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { Notification } from '../../models/notification.model';

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
          <button class="popup-dismiss" (click)="dismissPopup()" title="Dismiss">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  unreadCount = 0;
  showPopup = false;
  activeNotification: Notification | null = null;
  currentUser: UserResponse | null = null;

  ngOnInit(): void {
    // Subscribe to incoming notifications
    this.notifSub = this.notificationService.onNotification.subscribe((notification) => {
      this.handleNewNotification(notification);
    });

    // Auto-connect/disconnect WebSocket based on auth state
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.notificationService.connect();
        
        // Fetch initial unread count
        this.notificationService.getUnreadCount().subscribe({
          next: (count) => {
            this.unreadCount = count;
            this.cdr.markForCheck();
          },
          error: (err) => console.error('[NotificationBell] Failed to fetch unread count', err)
        });
      } else {
        this.notificationService.disconnect();
        this.unreadCount = 0;
      }
    });
  }

  private handleNewNotification(notification: Notification): void {
    // Increment unread count
    this.unreadCount++;

    // Replace any existing popup with the new notification
    this.clearAutoDismissTimer();
    this.activeNotification = notification;
    this.showPopup = true;

    // Trigger UI update for new notification
    this.cdr.markForCheck();

    // Auto-dismiss after 10 seconds
    this.autoDismissTimer = setTimeout(() => {
      this.showPopup = false;
      this.activeNotification = null;

      // Trigger UI update for timeout dismissal
      this.cdr.markForCheck();
    }, 10000);
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
    this.router.navigate(['/notifications']);
  }

  onNotificationClick(): void {
    const notification = this.activeNotification;
    this.dismissPopup();

    if (notification) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          if (this.unreadCount > 0) {
            this.unreadCount--;
            this.cdr.markForCheck();
          }
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
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.clearAutoDismissTimer();
  }
}
