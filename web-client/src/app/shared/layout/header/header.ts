import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() userName = 'Nora Idrissi';
  @Input() userRole = 'Client';
  notificationCount = 1;

  onToggle() {
    this.toggleSidebar.emit();
  }
}
