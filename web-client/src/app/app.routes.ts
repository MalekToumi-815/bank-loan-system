import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'client', loadChildren: () => import('./features/client/client.routes').then(m => m.CLIENT_ROUTES) },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
];
