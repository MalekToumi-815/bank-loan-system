import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminUserService, PaginatedUsersResponse } from '../../services/admin-user.service';
import { RegisterRequest, UserResponse } from '../../../auth/models/auth.model';
import { UserRole } from '../../../../core/models/user-role.enum';
import { UserStatus } from '../../../../core/models/user-status.enum';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './users.component.css',
  template: `
    <section class="admin-users-page">
      <div class="admin-users-header">
        <div>
          <p class="admin-users-kicker">Bank Admin Desk</p>
          <h1 class="admin-users-title">User Management</h1>
        </div>
        <button type="button" class="admin-users-create-btn" (click)="openCreateDialog()">
          Add new employee
        </button>
      </div>

      @if (loading()) {
        <div class="admin-users-state">Loading users...</div>
      }

      @if (error()) {
        <div class="admin-users-state admin-users-error">{{ error() }}</div>
      }

      @if (!loading() && !error()) {
        <div class="admin-users-filters">
          <label class="admin-users-filter-field admin-users-filter-field-wide">
            <span>Search</span>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Search by id, name, surname or email"
            />
            <small>Searches id, name, surname, and email</small>
          </label>

          <label class="admin-users-filter-field">
            <span>Role</span>
            <select [(ngModel)]="selectedRole" (change)="applyFilters()">
              <option value="">All roles</option>
              <option value="CLIENT">Client</option>
              <option value="BANK_ADMIN">Bank Admin</option>
              <option value="BANK_RECEPTIONIST">Bank Receptionist</option>
              <option value="LOAN_OFFICER">Loan Officer</option>
            </select>
          </label>

          <label class="admin-users-filter-field">
            <span>Status</span>
            <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <button type="button" class="admin-users-search-btn" (click)="applyFilters()">
            Search
          </button>
        </div>

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

      @if (createDialogOpen()) {
        <div class="admin-users-dialog-backdrop" (click)="closeCreateDialog()">
          <div class="admin-users-dialog admin-users-create-dialog" (click)="$event.stopPropagation()">
            <div class="admin-users-dialog-header">
              <div>
                <p class="admin-users-dialog-kicker">Create employee</p>
                <h2>New user account</h2>
              </div>
              <button type="button" class="admin-users-dialog-close" (click)="closeCreateDialog()">×</button>
            </div>

            @if (createErrorMessage()) {
              <div class="admin-users-state admin-users-error">{{ createErrorMessage() }}</div>
            }

            <form class="admin-users-create-form" #createForm="ngForm" (ngSubmit)="createEmployee()">
              <div class="admin-users-create-grid">
                <label class="admin-users-filter-field">
                  <span>First name</span>
                  <input type="text" [(ngModel)]="createUserData.name" name="createName" placeholder="First name" required />
                </label>

                <label class="admin-users-filter-field">
                  <span>Last name</span>
                  <input type="text" [(ngModel)]="createUserData.surname" name="createSurname" placeholder="Last name" required />
                </label>

                <label class="admin-users-filter-field">
                  <span>Email</span>
                  <input type="email" [(ngModel)]="createUserData.email" name="createEmail" placeholder="name@example.com" required />
                </label>

                <label class="admin-users-filter-field">
                  <span>Phone</span>
                  <input type="tel" [(ngModel)]="createUserData.phone" name="createPhone" placeholder="Phone number" required />
                </label>

                <label class="admin-users-filter-field">
                  <span>CIN</span>
                  <input type="text" [(ngModel)]="createUserData.cin" name="createCin" placeholder="National ID" required />
                </label>

                <label class="admin-users-filter-field">
                  <span>Role</span>
                  <select [(ngModel)]="createUserData.role" name="createRole" required>
                    <option [ngValue]="UserRole.BANK_ADMIN">Bank Admin</option>
                    <option [ngValue]="UserRole.BANK_RECEPTIONIST">Bank Receptionist</option>
                    <option [ngValue]="UserRole.LOAN_OFFICER">Loan Officer</option>
                  </select>
                </label>

                <label class="admin-users-filter-field">
                  <span>Password</span>
                  <input type="password" [(ngModel)]="createUserData.password" name="createPassword" placeholder="Password" required />
                </label>

                <label class="admin-users-filter-field">
                  <span>Confirm password</span>
                  <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirm password" required />
                </label>
              </div>

              <div class="admin-users-create-actions">
                <button type="button" class="admin-users-create-cancel" (click)="closeCreateDialog()">Cancel</button>
                <button type="submit" class="admin-users-create-submit" [disabled]="creatingUser() || createForm.invalid">
                  {{ creatingUser() ? 'Creating...' : 'Create employee' }}
                </button>
              </div>
            </form>
          </div>
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

  readonly UserRole = UserRole;

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
  readonly creatingUser = signal(false);
  readonly createDialogOpen = signal(false);
  readonly createErrorMessage = signal('');
  selectedRole = '';
  selectedStatus = '';
  searchTerm = '';
  confirmPassword = '';
  createUserData: RegisterRequest = {
    name: '',
    surname: '',
    email: '',
    cin: '',
    phone: '',
    password: '',
    role: UserRole.BANK_RECEPTIONIST,
    status: UserStatus.ACTIVE
  };

  constructor() {
    this.loadUsers();
  }

  loadUsers(params?: { search?: string }): void {
    const requestParams = {
      page: this.page(),
      size: 10,
      role: this.selectedRole || undefined,
      status: this.selectedStatus || undefined,
      search: params?.search ?? (this.searchTerm || undefined)
    };

    console.log('Loading users with params:', requestParams);
    this.loading.set(true);
    this.error.set(null);

    this.adminUserService.getUsers(requestParams).subscribe({
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

  applyFilters(): void {
    this.page.set(0);
    this.loadUsers({ search: this.searchTerm });
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
    console.log(`Updating user ${user.id} status to ${nextStatus}`);
    this.updatingStatus.set(true);

    this.adminUserService.updateUserStatus(user.id, nextStatus, user.id).subscribe({
      next: () => {
        console.log(`User ${user.id} status updated to ${nextStatus}`);
        const updatedUser = { ...user, status: nextStatus };
        this.selectedUser.set(updatedUser);
        this.users.update((current) => ({
          ...current,
          content: current.content.map((item) => item.id === user.id ? updatedUser : item)
        }));
        this.updatingStatus.set(false);
      },
      error: (error) => {
        console.error(`Failed to update user ${user.id} status`, error);
        this.updatingStatus.set(false);
        this.error.set('Unable to update user status.');
      }
    });
  }

  openCreateDialog(): void {
    this.createErrorMessage.set('');
    this.confirmPassword = '';
    this.createUserData = {
      name: '',
      surname: '',
      email: '',
      cin: '',
      phone: '',
      password: '',
      role: UserRole.BANK_RECEPTIONIST,
      status: UserStatus.ACTIVE
    };
    this.createDialogOpen.set(true);
    console.log('Opened create employee dialog');
  }

  closeCreateDialog(): void {
    this.createDialogOpen.set(false);
    this.createErrorMessage.set('');
    this.confirmPassword = '';
    console.log('Closed create employee dialog');
  }

  createEmployee(): void {
    this.createErrorMessage.set('');

    const trimmedName = this.createUserData.name.trim();
    const trimmedSurname = this.createUserData.surname.trim();
    const trimmedEmail = this.createUserData.email.trim();
    const trimmedPhone = this.createUserData.phone.trim();
    const trimmedCin = this.createUserData.cin.trim();
    const trimmedPassword = this.createUserData.password?.trim() || '';

    if (!trimmedName || !trimmedSurname || !trimmedEmail || !trimmedPhone || !trimmedCin || !trimmedPassword || !this.createUserData.role) {
      this.createErrorMessage.set('Please fill in all required fields.');
      return;
    }

    if (this.createUserData.password !== this.confirmPassword) {
      this.createErrorMessage.set('Passwords do not match.');
      return;
    }

    this.creatingUser.set(true);
    console.log('Creating employee user with role:', this.createUserData.role);

    this.adminUserService.createUser(this.createUserData).subscribe({
      next: (response) => {
        console.log('Employee created successfully:', response.message);
        this.creatingUser.set(false);
        this.closeCreateDialog();
        this.page.set(0);
        this.loadUsers();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to create employee user', error);
        this.creatingUser.set(false);

        if (error.error?.message) {
          this.createErrorMessage.set(error.error.message);
        } else if (error.status === 409) {
          this.createErrorMessage.set('This email is already registered.');
        } else {
          this.createErrorMessage.set('Employee creation failed. Please try again.');
        }
      }
    });
  }
}
