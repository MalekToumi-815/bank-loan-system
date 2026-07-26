import { UserRole } from '../../../core/models/user-role.enum';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const CLIENT_MENU: MenuGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: 'grid', route: '/client/dashboard' }
    ]
  },
  {
    title: 'Loans',
    items: [
      { label: 'My Requests', icon: 'clipboard', route: '/client/dashboard' },
      { label: 'New Request', icon: 'plus-circle', route: '/client/dashboard' }
    ]
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', icon: 'bell', route: '/client/dashboard' },
      { label: 'Profile', icon: 'user', route: '/client/dashboard' }
    ]
  }
];

export const MENU_BY_ROLE: Record<UserRole, MenuGroup[]> = {
  [UserRole.CLIENT]: CLIENT_MENU,
  [UserRole.BANK_RECEPTIONIST]: CLIENT_MENU,
  [UserRole.LOAN_OFFICER]: CLIENT_MENU,
  [UserRole.BANK_ADMIN]: CLIENT_MENU
};
