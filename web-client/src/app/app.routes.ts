import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardPlaceholderComponent } from './core/layout/dashboard-placeholder/dashboard-placeholder.component';
import { MyLoansComponent } from './features/client/pages/my-loans/my-loans.component';
import { NewRequestComponent } from './features/client/pages/new-request/new-request.component';
import { AdminMyTasksComponent } from './features/admin/pages/my-tasks/my-tasks.component';
import { MyTasksComponent } from './features/receptionist/pages/my-tasks/my-tasks.component';
import { OfficerMyTasksComponent } from './features/officer/pages/my-tasks/my-tasks.component';
import { ProfilePageComponent } from './features/profile/pages/profile-page/profile-page.component';
import { AdminUsersComponent } from './features/admin/pages/users/users.component';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    children: [
      { path: '', component: DashboardPlaceholderComponent },
      { path: 'my-loans', component: MyLoansComponent },
      { path: 'new-request', component: NewRequestComponent },
      { path: 'my-tasks', component: MyTasksComponent },
      { path: 'officer-tasks', component: OfficerMyTasksComponent },
      { path: 'admin-tasks', component: AdminMyTasksComponent },
      { path: 'admin-users', component: AdminUsersComponent },
      { path: 'profile', component: ProfilePageComponent }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];


