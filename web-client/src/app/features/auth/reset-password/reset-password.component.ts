import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!newPassword || !confirmPassword) {
    return null;
  }

  if (newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }

  return null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  resetPasswordForm: FormGroup = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

  token: string | null = null;
  hasInvalidToken = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showNewPassword = false;
  showConfirmPassword = false;

  private redirectTimeout: any;

  get newPasswordControl() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  get hasPasswordMismatchError() {
    return (
      (this.resetPasswordForm.hasError('passwordMismatch') ||
        this.confirmPasswordControl?.hasError('passwordMismatch')) &&
      (this.confirmPasswordControl?.touched || this.resetPasswordForm.touched)
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.hasInvalidToken = true;
      this.errorMessage =
        'Invalid or missing reset token. Please request a new password reset link.';
    }
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.hasInvalidToken || !this.token) {
      this.errorMessage = 'Cannot submit form: invalid or missing password reset token.';
      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const newPassword = this.resetPasswordForm.value.newPassword;

    this.authService.resetPassword({ token: this.token, newPassword }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage =
          response.message ||
          'Password has been successfully reset! Redirecting to login page...';
        this.cdr.detectChanges();

        this.redirectTimeout = setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        if (err.error?.error) {
          this.errorMessage = err.error.error;
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage =
            'Failed to reset password. The link may have expired or is invalid.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
