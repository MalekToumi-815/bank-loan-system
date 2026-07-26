import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { UserRole } from '../../core/models/user-role.enum';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Sidebar],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout {
  sidebarCollapsed = signal(false);
  userRole = UserRole.CLIENT;

  toggleSidebar() {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }
}
