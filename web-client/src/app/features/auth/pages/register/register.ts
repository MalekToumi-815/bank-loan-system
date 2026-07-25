import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';
import { UserRole } from '../../../../core/models/user-role.enum';
import { UserStatus } from '../../../../core/models/user-status.enum';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
    role: UserRole.CLIENT, // Forced
    status: UserStatus.ACTIVE // Forced
  };

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    // Force role and status as requested
    this.userData.role = UserRole.CLIENT;
    this.userData.status = UserStatus.ACTIVE;

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response.message);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Registration failed:', err);
      }
    });
  }
}
