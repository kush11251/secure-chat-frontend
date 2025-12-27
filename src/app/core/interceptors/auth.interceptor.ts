import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionStore } from '../store/session.store';
import { WebsocketService } from '../services/websocket.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = inject(SessionStore);
  const ws = inject(WebsocketService);

  const handleAuthFailure = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    } catch {}
    session.clear();
    ws.disconnect();
    router.navigateByUrl('/auth/login');
  };

  const withAuth = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(withAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (refreshToken) {
          return auth.refresh().pipe(
            switchMap(() => {
              const newToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
              const retried = newToken
                ? withAuth.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                : withAuth;
              return next(retried);
            }),
            catchError(() => {
              handleAuthFailure();
              return throwError(() => err);
            })
          );
        }
        handleAuthFailure();
      } else if (err.status === 403) {
        handleAuthFailure();
      }
      return throwError(() => err);
    })
  );
};
