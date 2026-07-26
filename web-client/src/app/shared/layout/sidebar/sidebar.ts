import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuGroup, MENU_BY_ROLE } from './sidebar.config';
import { UserRole } from '../../../core/models/user-role.enum';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() collapsed = false;
  @Input() userRole: UserRole = UserRole.CLIENT;

  get menuGroups(): MenuGroup[] {
    return MENU_BY_ROLE[this.userRole] ?? MENU_BY_ROLE[UserRole.CLIENT];
  }
}
