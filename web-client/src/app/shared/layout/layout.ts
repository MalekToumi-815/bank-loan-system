import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { UserRole } from '../../core/models/user-role.enum';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Sidebar],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout {
  private authService = inject(AuthService);
  public currentUser$ = this.authService.currentUser$;
  public UserRole = UserRole;
  sidebarCollapsed = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  mapUserRole(role?: string): UserRole {
    if (!role) {
      return UserRole.CLIENT;
    }

    const normalized = role.toUpperCase() as keyof typeof UserRole;
    return UserRole[normalized] ?? UserRole.CLIENT;
  }
}
