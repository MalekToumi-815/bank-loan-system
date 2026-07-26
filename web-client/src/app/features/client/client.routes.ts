import { Routes } from '@angular/router';
import { Layout } from '../../shared/layout/layout';
import { ClientDashboard } from './pages/dashboard/dashboard';
import { ClientPagePlaceholder } from './pages/page-placeholder';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'dashboard', component: ClientDashboard },
      { path: 'requests', component: ClientPagePlaceholder, data: { title: 'My Requests', description: 'Your loan requests and status updates are shown here.' } },
      { path: 'new-request', component: ClientPagePlaceholder, data: { title: 'New Request', description: 'Create a new credit request for review by the bank.' } },
      { path: 'notifications', component: ClientPagePlaceholder, data: { title: 'Notifications', description: 'Recent alerts and messages from the bank will appear here.' } },
      { path: 'profile', component: ClientPagePlaceholder, data: { title: 'Profile', description: 'Manage your client profile and account settings.' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
