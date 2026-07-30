import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  submittedSuccessfully = false;

  get emailControl() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const email = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submittedSuccessfully = true;
        this.successMessage =
          response.message ||
          'If an account exists for this email, a reset link has been sent to your inbox.';
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.error?.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'An error occurred while sending the reset link. Please try again later.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
