import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AdminUserService, PaginatedUsersResponse } from '../../services/admin-user.service';
import { UserResponse } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './users.component.css',
  template: `
    <section class="admin-users-page">
      <div class="admin-users-header">
        <div>
          <p class="admin-users-kicker">Bank Admin Desk</p>
          <h1 class="admin-users-title">User Management</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="admin-users-state">Loading users...</div>
      }

      @if (error()) {
        <div class="admin-users-state admin-users-error">{{ error() }}</div>
      }

      @if (!loading() && !error()) {
        <div class="admin-users-table-wrap">
          <table class="admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users().content; track user.id) {
                <tr>
                  <td>
                    <div class="admin-users-name">{{ user.name }} {{ user.surname }}</div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role }}</td>
                  <td>
                    <div class="admin-users-actions">
                      <span class="admin-users-status" [class.active]="user.status === 'ACTIVE'">
                        {{ user.status }}
                      </span>
                      <button type="button" class="admin-users-button" (click)="openUserDetails(user)">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="admin-users-pagination">
          <button type="button" class="admin-users-page-btn" [disabled]="page() === 0" (click)="previousPage()">
            Previous
          </button>
          <span class="admin-users-page-info">Page {{ page() + 1 }} of {{ users().totalPages || 1 }}</span>
          <button type="button" class="admin-users-page-btn" [disabled]="page() + 1 >= (users().totalPages || 1)" (click)="nextPage()">
            Next
          </button>
        </div>
      }
    </section>

    @if (selectedUser()) {
      <div class="admin-users-dialog-backdrop" (click)="closeUserDetails()">
        <div class="admin-users-dialog" (click)="$event.stopPropagation()">
          <div class="admin-users-dialog-header">
            <div>
              <p class="admin-users-dialog-kicker">User profile</p>
              <h2>{{ selectedUser()?.name }} {{ selectedUser()?.surname }}</h2>
            </div>
            <button type="button" class="admin-users-dialog-close" (click)="closeUserDetails()">×</button>
          </div>

          <div class="admin-users-dialog-grid">
            <div class="admin-users-field-row">
              <span>ID</span>
              <strong>{{ selectedUser()?.id }}</strong>
            </div>
            <div class="admin-users-field-row">
              <span>Email</span>
              <strong>{{ selectedUser()?.email }}</strong>
            </div>
            <div class="admin-users-field-row">
              <span>Phone</span>
              <strong>{{ selectedUser()?.phone || '—' }}</strong>
            </div>
            <div class="admin-users-field-row">
              <span>CIN</span>
              <strong>{{ selectedUser()?.cin || '—' }}</strong>
            </div>
            <div class="admin-users-field-row">
              <span>Role</span>
              <strong>{{ selectedUser()?.role }}</strong>
            </div>
            <div class="admin-users-field-row">
              <span>Status</span>
              <strong>{{ selectedUser()?.status }}</strong>
            </div>
          </div>

          <div class="admin-users-dialog-actions">
            <button type="button" class="admin-users-button" (click)="toggleStatus()">
              {{ selectedUser()?.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminUsersComponent {
  private adminUserService = inject(AdminUserService);

  readonly users = signal<PaginatedUsersResponse<UserResponse>>({
    content: [],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      offset: 0,
      paged: true,
      unpaged: false
    },
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 20,
    number: 0,
    first: true,
    numberOfElements: 0,
    empty: true
  });
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedUser = signal<UserResponse | null>(null);
  readonly updatingStatus = signal(false);

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminUserService.getUsers({ page: this.page(), size: 10 }).subscribe({
      next: (response) => {
        this.users.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to load users right now.');
      }
    });
  }

  previousPage(): void {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.page() + 1 < (this.users().totalPages || 1)) {
      this.page.set(this.page() + 1);
      this.loadUsers();
    }
  }

  openUserDetails(user: UserResponse): void {
    this.selectedUser.set(user);
  }

  closeUserDetails(): void {
    this.selectedUser.set(null);
  }

  toggleStatus(): void {
    const user = this.selectedUser();
    if (!user) {
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.updatingStatus.set(true);

    this.adminUserService.updateUserStatus(user.id, nextStatus, user.id).subscribe({
      next: () => {
        const updatedUser = { ...user, status: nextStatus };
        this.selectedUser.set(updatedUser);
        this.users.update((current) => ({
          ...current,
          content: current.content.map((item) => item.id === user.id ? updatedUser : item)
        }));
        this.updatingStatus.set(false);
      },
      error: () => {
        this.updatingStatus.set(false);
        this.error.set('Unable to update user status.');
      }
    });
  }
}
