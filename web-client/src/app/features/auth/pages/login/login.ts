import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  fillDemoAccount(role: string) {
    this.email = `${role}@app.com`;
    this.password = '123456';
  }

  onSubmit() {
    console.log('Login attempt with:', this.email, this.password);
    // TODO: implement real login
  }
}
