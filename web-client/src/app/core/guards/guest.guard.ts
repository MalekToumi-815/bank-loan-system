import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Guards guest-only routes (login, register, forgot-password, reset-password).
 * Waits for startup hydration to settle before deciding, then redirects
 * already-authenticated users away to /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authReady$.pipe(
    filter(ready => ready),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (!user) {
        return true;
      }
      // User is already logged in — send them to the dashboard.
      return router.createUrlTree(['/dashboard']);
    })
  );
};

