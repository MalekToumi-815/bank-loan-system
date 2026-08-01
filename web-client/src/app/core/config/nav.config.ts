import { UserRole } from '../models/user-role.enum';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  section?: string;
}

/**
 * Navigation items grouped by user roles.
 */
export const NAV_ITEMS: Record<string, NavItem[]> = {
  // Navigation items for CLIENT role
  [UserRole.CLIENT]: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: [UserRole.CLIENT],
      section: 'Overview'
    },
    {
      label: 'My Requests',
      icon: 'file-text',
      route: '/dashboard/my-loans',
      roles: [UserRole.CLIENT],
      section: 'Loans'
    },
    {
      label: 'New Request',
      icon: 'plus-circle',
      route: '',
      roles: [UserRole.CLIENT],
      section: 'Loans'
    },
    {
      label: 'Notifications',
      icon: 'bell',
      route: '',
      roles: [UserRole.CLIENT],
      section: 'Account'
    },
    {
      label: 'Profile',
      icon: 'user',
      route: '/dashboard/profile',
      roles: [UserRole.CLIENT],
      section: 'Account'
    }
  ],

  // Place links for BANK_RECEPTIONIST role here
  [UserRole.BANK_RECEPTIONIST]: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '',
      roles: [UserRole.BANK_RECEPTIONIST],
      section: 'Overview'
    },
    {
      label: 'Notifications',
      icon: 'bell',
      route: '',
      roles: [UserRole.BANK_RECEPTIONIST],
      section: 'Account'
    },
    {
      label: 'Profile',
      icon: 'user',
      route: '/dashboard/profile',
      roles: [UserRole.BANK_RECEPTIONIST],
      section: 'Account'
    }
  ],

  // Place links for LOAN_OFFICER role here
  [UserRole.LOAN_OFFICER]: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '',
      roles: [UserRole.LOAN_OFFICER],
      section: 'Overview'
    },
    {
      label: 'Notifications',
      icon: 'bell',
      route: '',
      roles: [UserRole.LOAN_OFFICER],
      section: 'Account'
    },
    {
      label: 'Profile',
      icon: 'user',
      route: '/dashboard/profile',
      roles: [UserRole.LOAN_OFFICER],
      section: 'Account'
    }
  ],

  // Place links for BANK_ADMIN role here
  [UserRole.BANK_ADMIN]: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '',
      roles: [UserRole.BANK_ADMIN],
      section: 'Overview'
    },
    {
      label: 'Notifications',
      icon: 'bell',
      route: '',
      roles: [UserRole.BANK_ADMIN],
      section: 'Account'
    },
    {
      label: 'Profile',
      icon: 'user',
      route: '/dashboard/profile',
      roles: [UserRole.BANK_ADMIN],
      section: 'Account'
    }
  ]
};
