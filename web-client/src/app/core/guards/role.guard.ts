import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { UserRole } from '../models/user-role.enum';

/**
 * Protects routes that require a specific user role.
 * Waits for startup hydration to settle, then reads the allowed roles
 * from `route.data.roles` (UserRole[]). Redirects to /dashboard if the
 * user's role is not in the allowed list.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: UserRole[] = route.data['roles'] ?? [];

  return authService.authReady$.pipe(
    filter(ready => ready),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (!user) {
        return router.createUrlTree(['/auth/login']);
      }

      if (allowedRoles.length === 0 || allowedRoles.includes(user.role as UserRole)) {
        return true;
      }

      return router.createUrlTree(['/dashboard']);
    })
  );
};

