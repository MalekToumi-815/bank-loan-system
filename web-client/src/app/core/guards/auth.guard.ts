import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Protects routes that require authentication.
 * Waits for the startup hydration to settle before deciding,
 * then redirects unauthenticated users to /auth/login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authReady$.pipe(
    filter(ready => ready),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/auth/login']);
    })
  );
};

