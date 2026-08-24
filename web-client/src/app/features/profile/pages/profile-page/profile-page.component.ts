import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { UserResponse } from '../../../auth/models/auth.model';
import { ProfileService } from '../../services/profile.service';
import { FormatRolePipe } from '../../../../shared/pipes/format-role.pipe';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatRolePipe],
  styleUrl: './profile-page.component.css',
  template: `
    <section class="profile-page">
      <div>
        <h1 class="profile-title">Profile</h1>
        <p class="profile-subtitle">Your personal information and role.</p>
      </div>

      <div class="profile-grid">
        <div class="profile-panel">
          <h2>Personal information</h2>

          <form class="profile-form-grid" (ngSubmit)="saveProfile()">
            <div class="profile-field">
              <label for="name">First name</label>
              <input id="name" class="profile-input" [(ngModel)]="profileForm().name" name="name" />
            </div>

            <div class="profile-field">
              <label for="surname">Last name</label>
              <input id="surname" class="profile-input" [(ngModel)]="profileForm().surname" name="surname" />
            </div>

            <div class="profile-field full">
              <label for="email">Email</label>
              <input id="email" class="profile-input" [value]="currentUser()?.email || ''" name="email" disabled />
            </div>

            <div class="profile-field">
              <label for="phone">Phone</label>
              <input id="phone" class="profile-input" [(ngModel)]="profileForm().phone" name="phone" />
            </div>

            <div class="profile-field">
              <label for="cin">CIN</label>
              <input id="cin" class="profile-input" [(ngModel)]="profileForm().cin" name="cin" />
            </div>

            <div class="profile-actions">
              <button class="profile-button" type="submit">Save changes</button>
            </div>
          </form>

          @if (profileMessage()) {
            <div class="profile-message" [class.error]="profileMessageType() === 'error'">
              {{ profileMessage() }}
            </div>
          }
        </div>

        <aside class="profile-panel">
          <h2>Account</h2>
          <div class="profile-account-list">
            <div class="profile-account-row">
              <span>Role</span>
              <strong>{{ currentUser()?.role | formatRole }}</strong>
            </div>
            <div class="profile-account-row">
              <span>User ID</span>
              <strong>{{ currentUser()?.id || '—' }}</strong>
            </div>
          </div>

          <h3 style="margin-top: 1.5rem;">Change password</h3>
          <form class="profile-form-grid" (ngSubmit)="changePassword()">
            <div class="profile-field full">
              <label for="oldPassword">Old password</label>
              <input id="oldPassword" type="password" class="profile-input" [(ngModel)]="passwordForm().oldPassword" name="oldPassword" />
            </div>

            <div class="profile-field full">
              <label for="newPassword">New password</label>
              <input id="newPassword" type="password" class="profile-input" [(ngModel)]="passwordForm().newPassword" name="newPassword" />
            </div>

            <div class="profile-field full">
              <label for="confirmPassword">Confirm new password</label>
              <input id="confirmPassword" type="password" class="profile-input" [(ngModel)]="passwordForm().confirmPassword" name="confirmPassword" />
            </div>

            <div class="profile-actions">
              <button class="profile-button-secondary" type="submit">Change password</button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  `
})
export class ProfilePageComponent {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  currentUser = toSignal<UserResponse | null>(this.authService.currentUser$, { initialValue: null });

  profileForm = signal({
    name: '',
    surname: '',
    cin: '',
    phone: ''
  });

  passwordForm = signal({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  profileMessage = signal('');
  profileMessageType = signal<'success' | 'error' | ''>('');

  constructor() {
    const current = this.currentUser();
    this.syncForm(current);

    this.authService.currentUser$.subscribe(user => {
      this.syncForm(user);
    });
  }

  saveProfile() {
    const user = this.currentUser();
    if (!user) {
      this.setProfileMessage('User session is not ready yet.', 'error');
      return;
    }

    const payload = {
      name: this.profileForm().name,
      surname: this.profileForm().surname,
      cin: this.profileForm().cin,
      phone: this.profileForm().phone,
      email: user.email,
      role: user.role,
      status: user.status
    };

    this.profileService.updateProfile(user.id, payload).subscribe({
      next: () => {
        const refreshedUser: UserResponse = {
          ...user,
          ...payload
        };

        this.authService.setCurrentUser(refreshedUser);
        this.syncForm(refreshedUser);
        this.setProfileMessage('Profile updated successfully.', 'success');
      },
      error: () => {
        this.setProfileMessage('Unable to save your profile right now.', 'error');
      }
    });
  }

  changePassword() {
    const user = this.currentUser();
    const passwordData = this.passwordForm();

    if (!user) {
      this.setProfileMessage('User session is not ready yet.', 'error');
      return;
    }

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      this.setProfileMessage('Please provide your old password, new password and confirmation.', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      this.setProfileMessage('New password and confirmation do not match.', 'error');
      return;
    }

    this.profileService.changePassword(user.id, passwordData).subscribe({
      next: () => {
        this.passwordForm.set({ oldPassword: '', newPassword: '', confirmPassword: '' });
        this.setProfileMessage('Password changed successfully.', 'success');
      },
      error: () => {
        this.setProfileMessage('Current password is invalid or the request could not be completed.', 'error');
      }
    });
  }

  private syncForm(user: UserResponse | null) {
    if (!user) {
      return;
    }

    this.profileForm.set({
      name: user.name,
      surname: user.surname,
      cin: user.cin,
      phone: user.phone
    });
  }

  private setProfileMessage(message: string, type: 'success' | 'error') {
    this.profileMessage.set(message);
    this.profileMessageType.set(type);
  }
}
