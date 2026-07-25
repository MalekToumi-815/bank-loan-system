import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  
  private authService = inject(AuthService);
  private router = inject(Router);

  fillDemoAccount(role: string) {
    this.email = `${role}@app.com`;
    this.password = '123456';
  }

  onSubmit() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('Login successful!', response);
        // this.router.navigate(['/client/dashboard']); // Example routing after login
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }
}
