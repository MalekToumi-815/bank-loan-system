import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { guestGuard } from '../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  { path: 'login',           component: Login,                  canActivate: [guestGuard] },
  { path: 'register',        component: Register,               canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'reset-password',  component: ResetPasswordComponent,  canActivate: [guestGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];



