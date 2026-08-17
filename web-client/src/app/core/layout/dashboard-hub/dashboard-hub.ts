import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../features/auth/services/auth.service';
import { UserRole } from '../../models/user-role.enum';
import { ClientDashboard } from '../../../features/client/pages/client-dashboard/client-dashboard';
import { AdminDashboard } from '../../../features/admin/pages/admin-dashboard/admin-dashboard';
import { OfficerDashboard } from '../../../features/officer/pages/officer-dashboard/officer-dashboard';
import { ReceptionistDashboard } from '../../../features/receptionist/pages/receptionist-dashboard/receptionist-dashboard';
import { DashboardPlaceholderComponent } from '../dashboard-placeholder/dashboard-placeholder.component';

@Component({
  selector: 'app-dashboard-hub',
  standalone: true,
  imports: [
    ClientDashboard,
    AdminDashboard,
    OfficerDashboard,
    ReceptionistDashboard,
    DashboardPlaceholderComponent
  ],
  templateUrl: './dashboard-hub.html',
  styleUrl: './dashboard-hub.css',
})
export class DashboardHub {
  private authService = inject(AuthService);
  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  UserRole = UserRole; // Expose enum to template
}
