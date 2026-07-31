import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NAV_ITEMS, NavItem } from '../../config/nav.config';

interface NavGroup {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styleUrl: './sidebar.component.css',
  template: `
    <aside class="app-sidebar w-64 bg-[#091222] border-r border-slate-800/80 flex flex-col justify-between p-4 h-[calc(100vh-4rem)] overflow-y-auto shrink-0 select-none">
      <div class="space-y-6">
        <!-- Navigation Links List Grouped by Section -->
        <nav class="space-y-5">
          @for (group of groupedNavSections(); track group.title || $index) {
            <div class="sidebar-nav-group space-y-2">
              @if (group.title) {
                <h3 class="sidebar-section-title px-3 text-xs font-semibold text-slate-400 tracking-wider">
                  {{ group.title }}
                </h3>
              }
              <div class="space-y-1">
                @for (item of group.items; track item.label) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active bg-[#172A4B] text-white font-semibold shadow-sm"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="nav-item-link flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-[#13223E] hover:text-white transition-all duration-150 group text-sm font-medium"
                  >
                    <!-- Dynamic SVG Icon render based on icon key -->
                    <ng-container [ngSwitch]="item.icon">
                      <!-- Dashboard / Grid icon -->
                      <svg *ngSwitchCase="'dashboard'" class="nav-item-icon w-5 h-5 shrink-0 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                      <!-- File text / My Requests icon -->
                      <svg *ngSwitchCase="'file-text'" class="nav-item-icon w-5 h-5 shrink-0 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <!-- Plus circle / New Request icon -->
                      <svg *ngSwitchCase="'plus-circle'" class="nav-item-icon w-5 h-5 shrink-0 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <!-- Bell / Notifications icon -->
                      <svg *ngSwitchCase="'bell'" class="nav-item-icon w-5 h-5 shrink-0 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <!-- User / Profile icon -->
                      <svg *ngSwitchCase="'user'" class="nav-item-icon w-5 h-5 shrink-0 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <!-- Default fallback icon -->
                      <i *ngSwitchDefault [class]="item.icon" class="nav-item-icon text-base text-slate-300 group-hover:text-white"></i>
                    </ng-container>

                    <span>{{ item.label }}</span>
                  </a>
                }
              </div>
            </div>
          } @empty {
            <!-- Graceful Empty State -->
            <div class="empty-state-card py-8 px-4 text-center rounded-xl bg-slate-800/30 border border-dashed border-slate-800">
              <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-xs font-semibold text-slate-300 mb-1">No Links Configured</p>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                No navigation items configured for role <span class="font-medium text-slate-400">{{ activeRole() || 'GUEST' }}</span>.
              </p>
            </div>
          }
        </nav>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer pt-4 border-t border-slate-800/80 text-center">
        <p class="text-[11px] text-slate-500 font-medium">Bank Loan System v1.0</p>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  activeRole = computed(() => this.currentUser()?.role || '');

  filteredNavItems = computed<NavItem[]>(() => {
    const role = this.activeRole();
    if (!role) {
      return [];
    }

    const items = NAV_ITEMS[role];
    if (items && items.length > 0) {
      return items;
    }

    const allItems = Object.values(NAV_ITEMS).flat();
    return allItems.filter(item => item.roles && item.roles.includes(role));
  });

  groupedNavSections = computed<NavGroup[]>(() => {
    const items = this.filteredNavItems();
    const map = new Map<string, NavItem[]>();

    for (const item of items) {
      const sectionKey = item.section || '';
      if (!map.has(sectionKey)) {
        map.set(sectionKey, []);
      }
      map.get(sectionKey)!.push(item);
    }

    return Array.from(map.entries()).map(([title, sectionItems]) => ({
      title: title || undefined,
      items: sectionItems
    }));
  });
}
