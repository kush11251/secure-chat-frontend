import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionStore } from '../store/session.store';
import { catchError, map, of, tap } from 'rxjs';

export const logoutGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = inject(SessionStore);

  return auth.logout().pipe(
    tap(() => session.clear()),
    map(() => router.createUrlTree(['/auth/login'])),
    catchError(() => {
      // If server fails, clear locally and continue
      try {
        session.clear();
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch {}
      return of(router.createUrlTree(['/auth/login']));
    })
  );
};
