import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserResponse } from '../../auth/models/auth.model';
import { ChangePasswordRequest, UpdateProfileResponse, UserProfilePayload } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  updateProfile(userId: number, payload: UserProfilePayload): Observable<UpdateProfileResponse> {
    const body: Partial<UserResponse> = {
      id: userId,
      name: payload.name,
      surname: payload.surname,
      cin: payload.cin,
      phone: payload.phone,
      email: payload.email ?? '',
      role: payload.role ?? 'CLIENT',
      status: payload.status ?? 'ACTIVE'
    };

    return this.http.put<UpdateProfileResponse>(`${this.baseUrl}account/users/${userId}`, body);
  }

  changePassword(userId: number, payload: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}account/users/${userId}/change-password`, {
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword
    }, {
      headers: {
        'X-User-Id': String(userId)
      }
    });
  }
}
