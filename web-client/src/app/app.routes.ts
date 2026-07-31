import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardPlaceholderComponent } from './core/layout/dashboard-placeholder/dashboard-placeholder.component';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    children: [
      { path: '', component: DashboardPlaceholderComponent }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];


