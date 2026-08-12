import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {

  private zone = inject(NgZone);
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
}
