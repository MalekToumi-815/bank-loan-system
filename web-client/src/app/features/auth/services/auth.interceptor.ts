import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject Injector instead of AuthService directly to avoid circular dependency (NG0200)
  const injector = inject(Injector);
  const accessToken = localStorage.getItem('access_token');

  let authReq = req;
  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/oauth/login') &&
        !req.url.includes('/oauth/refresh')
      ) {
        // Lazily get AuthService ONLY when a 401 error occurs
        const authService = injector.get(AuthService);
        return handle401Error(authReq, next, authService);
      }

      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;

        const newAccessToken = response.accessToken;
        const newRefreshToken = response.refreshToken;
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        refreshTokenSubject.next(newAccessToken);

        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${newAccessToken}` }
        }));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => refreshError);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) =>
      next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      }))
    )
  );
}