import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {

  private zone = inject(NgZone);
  private http = inject(HttpClient);
  private stompClient: Client | null = null;
  private readonly notifications$ = new Subject<Notification>();
  private readonly connected$ = new BehaviorSubject<boolean>(false);

  /** Emits each notification as it arrives in real-time. */
  get onNotification(): Observable<Notification> {
    return this.notifications$.asObservable();
  }

  /** Emits the current WebSocket connection status. */
  get isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Initialise the STOMP connection over WebSocket.
   * Call this once the user is authenticated (e.g. after login or on app init).
   */
  connect(): void {
    if (this.stompClient?.active) {
      return; // already connected
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[NotificationService] No access token found – skipping WebSocket connection.');
      return;
    }

    const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + 'workflow/ws-workflow';

    this.stompClient = new Client({
      webSocketFactory: () => new WebSocket(wsUrl, ['v10.stomp', token]),

      debug: (msg) => console.debug('[STOMP]', msg),

      reconnectDelay: 5000,

      onConnect: () => {
        console.log('[NotificationService] STOMP connected');
        this.connected$.next(true);

        this.stompClient!.subscribe('/user/queue/notifications', (message: IMessage) => {
          this.zone.run(() => {
            const notification: Notification = JSON.parse(message.body);
            console.log('[NotificationService] Notification received:', notification);
            this.notifications$.next(notification);
          });
        });
      },

      onStompError: (frame) => {
        console.error('[NotificationService] STOMP error:', frame.headers['message'], frame.body);
      },

      onWebSocketClose: (event) => {
        console.warn('[NotificationService] WebSocket closed. Code:', event.code, 'Reason:', event.reason);
        this.connected$.next(false);
      },
    });

    this.stompClient.activate();
  }

  /** Tear down the STOMP connection gracefully. */
  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.connected$.next(false);
      console.log('[NotificationService] Disconnected');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.notifications$.complete();
    this.connected$.complete();
  }

  // --- REST API Methods ---

  /**
   * Retrieves paginated notifications for the current user.
   * @param page Page index (0-based)
   * @param size Number of items per page
   * @param sortOrder 'asc' or 'desc' by timestamp (optional)
   * @param loanId Filter by loan ID (optional)
   * @param read Filter by read status (optional)
   */
  getUserNotifications(
    page: number = 0,
    size: number = 10,
    sortOrder?: 'asc' | 'desc',
    loanId?: number,
    read?: boolean
  ): Observable<Page<Notification>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sortOrder) {
      params = params.set('sort', `timestamp,${sortOrder}`);
    }

    if (loanId !== undefined && loanId !== null) {
      params = params.set('loanId', loanId.toString());
    }

    if (read !== undefined && read !== null) {
      params = params.set('read', read.toString());
    }

    return this.http.get<Page<Notification>>(`${environment.apiUrl}credit/notifications`, { params });
  }

  /**
   * Marks all notifications as read for the current user.
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}credit/notifications/read-all`, {});
  }

  /**
   * Marks a specific notification as read.
   */
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}credit/notifications/${id}/read`, {});
  }

  /**
   * Deletes a specific notification.
   */
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}credit/notifications/${id}`);
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}credit/notifications/unread-count`);
  }
}
