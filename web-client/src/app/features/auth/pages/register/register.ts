import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';
import { UserRole } from '../../../../core/models/user-role.enum';
import { UserStatus } from '../../../../core/models/user-status.enum';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  userData: RegisterRequest = {
    name: '',
    surname: '',
    email: '',
    cin: '',
    phone: '',
    password: '',
    role: UserRole.CLIENT,
    status: UserStatus.ACTIVE
  };

  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  onSubmit() {
    this.errorMessage = '';
    
    if (this.userData.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.userData.role = UserRole.CLIENT;
    this.userData.status = UserStatus.ACTIVE;

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response.message);
        this.router.navigate(['/auth/login']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 409) {
          this.errorMessage = 'This email is already registered.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
