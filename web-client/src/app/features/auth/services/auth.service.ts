import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, mapTo, tap } from 'rxjs';
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
  private baseUrl = environment.apiUrl;

  private loginResponse: LoginResponse | null = null;
  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

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
            this.currentUserSubject.next(user);
            console.log('Current user loaded:', user);
          }),
          mapTo(response)
        )
      )
    );
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

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.loginResponse = null;
    this.currentUserSubject.next(null);
  }
}
