import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardPlaceholderComponent } from './core/layout/dashboard-placeholder/dashboard-placeholder.component';
import { DashboardHub } from './core/layout/dashboard-hub/dashboard-hub';
import { MyLoansComponent } from './features/client/pages/my-loans/my-loans.component';
import { NewRequestComponent } from './features/client/pages/new-request/new-request.component';
import { AdminMyTasksComponent } from './features/admin/pages/my-tasks/my-tasks.component';
import { MyTasksComponent } from './features/receptionist/pages/my-tasks/my-tasks.component';
import { OfficerMyTasksComponent } from './features/officer/pages/my-tasks/my-tasks.component';
import { ProfilePageComponent } from './features/profile/pages/profile-page/profile-page.component';
import { AdminUsersComponent } from './features/admin/pages/users/users.component';
import { AdminLoansComponent } from './features/admin/pages/loans/loans.component';
import { NotificationsComponent } from './features/notifications/pages/notifications/notifications.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user-role.enum';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // ── Open to any authenticated user ─────────────────────────────────────
      { path: '',              component: DashboardHub },
      { path: 'profile',       component: ProfilePageComponent },
      { path: 'notifications', component: NotificationsComponent },

      // ── CLIENT only ────────────────────────────────────────────────────────
      {
        path: 'my-loans',
        component: MyLoansComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.CLIENT] }
      },
      {
        path: 'new-request',
        component: NewRequestComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.CLIENT] }
      },

      // ── BANK_RECEPTIONIST only ─────────────────────────────────────────────
      {
        path: 'my-tasks',
        component: MyTasksComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.BANK_RECEPTIONIST] }
      },

      // ── LOAN_OFFICER only ──────────────────────────────────────────────────
      {
        path: 'officer-tasks',
        component: OfficerMyTasksComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.LOAN_OFFICER] }
      },

      // ── BANK_ADMIN only ────────────────────────────────────────────────────
      {
        path: 'admin-tasks',
        component: AdminMyTasksComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.BANK_ADMIN] }
      },
      {
        path: 'admin-users',
        component: AdminUsersComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.BANK_ADMIN] }
      },
      {
        path: 'admin-loans',
        component: AdminLoansComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.BANK_ADMIN] }
      }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];



