import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();

  notificationCount = 1;
  userName = 'Nora Idrissi';
  userRole = 'Client';

  onToggle() {
    this.toggleSidebar.emit();
  }
}
