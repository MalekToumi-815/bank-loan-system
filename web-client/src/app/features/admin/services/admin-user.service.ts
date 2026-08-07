import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegisterRequest, RegisterResponse, UserResponse } from '../../auth/models/auth.model';

export interface PaginatedUsersResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface UpdateUserStatusRequest {
  status: string;
}

export interface UpdateUserStatusResponse {
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createUser(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}account/users`, userData);
  }

  getUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Observable<PaginatedUsersResponse<UserResponse>> {
    let httpParams = new HttpParams();

    if (params?.role) {
      httpParams = httpParams.set('role', params.role);
    }

    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<PaginatedUsersResponse<UserResponse>>(`${this.baseUrl}account/users`, {
      params: httpParams
    });
  }

  updateUserStatus(userId: number, status: string, currentUserId: number): Observable<UpdateUserStatusResponse> {
    return this.http.put<UpdateUserStatusResponse>(`${this.baseUrl}account/users/${userId}`, { status });
  }
}
