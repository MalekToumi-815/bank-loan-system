import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  styleUrl: './main-layout.component.css',
  template: `
    <div class="main-layout-wrapper min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      <!-- Top Header Bar -->
      <app-header />

      <!-- Main Layout Body: Sidebar + Dynamic Route Content -->
      <div class="main-layout-body flex flex-1 overflow-hidden">
        <!-- Left Sidebar Navigation -->
        <app-sidebar />

        <!-- Main Content Area -->
        <main class="main-content-container flex-1 p-6 overflow-y-auto bg-slate-950">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {}
