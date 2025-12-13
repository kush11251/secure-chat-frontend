import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const auth = inject(AuthService);
  const router = inject(Router);

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
              const retried = newToken ? withAuth.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }) : withAuth;
              return next(retried);
            }),
            catchError(() => {
              router.navigateByUrl('/auth/login');
              return throwError(() => err);
            })
          );
        }
        router.navigateByUrl('/auth/login');
      }
      return throwError(() => err);
    })
  );
};
