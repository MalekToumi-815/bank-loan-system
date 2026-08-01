import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, switchMap, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;

  private loginResponse: LoginResponse | null = null;
  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.hydrateCurrentUserOnStartup();
  }

  /**
   * Logs in the user and fetches their profile immediately using the returned userId.
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}oauth/login`, credentials).pipe(
      tap(response => {
        this.loginResponse = response;
        if (response.accessToken) {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
        }
      }),
      switchMap(response =>
        this.http.get<UserResponse>(`${this.baseUrl}account/users/${response.userId}`).pipe(
          tap(user => {
            this.setCurrentUser(user);
            console.log('Current user loaded:', user);
          }),
          map(() => response)
        )
      )
    );
  }

  /**
   * Updates the current user state subject.
   */
  setCurrentUser(user: UserResponse | null): void {
    this.currentUserSubject.next(user);
  }

  /**
   * Synchronizes and updates current user profile data from the account service.
   */
  refreshCurrentUser(userId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}account/users/${userId}`).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  /**
   * Re-hydrates current user state from localStorage token on app boot / refresh.
   */
  private hydrateCurrentUserOnStartup(): void {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      const decoded = this.decodeJwtPayload(accessToken);
      if (!decoded) {
        console.warn('Rehydration skipped: Access token structure is invalid.');
        this.logout();
        return;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < nowInSeconds) {
        console.warn('Rehydration skipped: Access token has expired.');
        this.handleMissingAccessTokenFallback();
        return;
      }

      const rawUserId = decoded.userId ?? decoded.sub;
      const numericUserId = Number(rawUserId);

      if (!rawUserId || isNaN(numericUserId)) {
        console.warn('Rehydration failed: No numeric User ID found in token claims. Claim value:', rawUserId);
        this.logout();
        return;
      }

      this.refreshCurrentUser(numericUserId).subscribe({
        next: (user) => {
          console.log('Current user successfully rehydrated from access token:', user);
        },
        error: (err) => {
          console.error('Rehydration failed: Unable to fetch user profile from backend.', err);
          this.handleMissingAccessTokenFallback();
        }
      });
      return;
    }

    this.handleMissingAccessTokenFallback();
  }

  private handleMissingAccessTokenFallback(): void {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      this.logout();
      return;
    }

    this.refreshToken()
      .pipe(
        switchMap(response => this.refreshCurrentUser(response.userId))
      )
      .subscribe({
        next: (user) => {
          console.log('Current user successfully rehydrated from refresh token:', user);
        },
        error: (err) => {
          console.error('Rehydration failed: Refresh token request failed.', err);
          this.logout();
        }
      });
  }

  /**
   * Decodes Base64Url JWT token payload safely without external libraries.
   */
  private decodeJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      let base64Url = parts[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse JWT payload:', e);
      return null;
    }
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}account/users`, userData);
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const payload: ForgotPasswordRequest = { email };
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}account/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.baseUrl}account/reset-password`, payload);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<LoginResponse>(`${this.baseUrl}oauth/refresh`, { token: refreshToken }).pipe(
      tap(response => {
        this.loginResponse = response;
        if (response.accessToken) {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.loginResponse = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}