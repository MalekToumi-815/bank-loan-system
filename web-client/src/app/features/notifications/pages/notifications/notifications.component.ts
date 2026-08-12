import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Notification } from '../../../../shared/models/notification.model';
import { Page } from '../../../../shared/models/page.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  notificationsPage: Page<Notification> | null = null;
  currentPage = 0;
  readonly pageSize = 10;
  sortOrder: 'asc' | 'desc' = 'desc';
  readFilter: 'all' | 'read' | 'unread' = 'all';
  searchLoanId: number | undefined = undefined;
  isLoading = false;
  toastMessage: string | null = null;
  private toastTimeout: any;
  
  private notifSub!: Subscription;

  ngOnInit(): void {
    this.loadNotifications();
    
    // Listen for new real-time notifications to update the list
    this.notifSub = this.notificationService.onNotification.subscribe((newNotif) => {
      // If we are on the first page and sorting by desc, just reload to get the latest
      if (this.currentPage === 0 && this.sortOrder === 'desc') {
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    let readParam: boolean | undefined = undefined;
    if (this.readFilter === 'read') readParam = true;
    else if (this.readFilter === 'unread') readParam = false;
    
    this.notificationService.getUserNotifications(this.currentPage, this.pageSize, this.sortOrder, this.searchLoanId, readParam).subscribe({
      next: (page) => {
        this.notificationsPage = page;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortOrder = value as 'asc' | 'desc';
    this.currentPage = 0; // reset to first page when sorting changes
    this.loadNotifications();
  }

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.readFilter = value as 'all' | 'read' | 'unread';
    this.currentPage = 0; // reset to first page when filter changes
    this.loadNotifications();
  }

  onSearchLoanIdChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchLoanId = value ? parseInt(value, 10) : undefined;
    this.currentPage = 0;
    this.loadNotifications();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificationService.clearUnreadCount();
        this.loadNotifications();
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;
    
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.notificationService.decrementUnreadCount();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

  deleteNotification(id: number, wasRead: boolean): void {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        if (!wasRead) {
          this.notificationService.decrementUnreadCount();
        }
        this.showToast('Notification deleted successfully');
        this.loadNotifications();
      },
      error: (err) => console.error('Failed to delete notification', err)
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.markForCheck();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3000);
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && (!this.notificationsPage || newPage < this.notificationsPage.totalPages)) {
      this.currentPage = newPage;
      this.loadNotifications();
    }
  }

  getPagesArray(): number[] {
    if (!this.notificationsPage) return [];
    return Array.from({ length: this.notificationsPage.totalPages }, (_, i) => i);
  }

  formatDate(dateStr: Date | string): string {
    return new Date(dateStr).toLocaleString();
  }

  ngOnDestroy(): void {
    if (this.notifSub) {
      this.notifSub.unsubscribe();
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
}
