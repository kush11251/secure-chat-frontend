import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionStore } from '../store/session.store';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const refresh = typeof localStorage !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  const router = inject(Router);
  const auth = inject(AuthService);
  const session = inject(SessionStore);

  if (token) {
    // Ensure session user is loaded from storage; SessionStore does this on init.
    return true;
  }

  if (refresh) {
    return auth.refresh().pipe(
      map(() => true),
      catchError(() => of(router.createUrlTree(['/auth/login'])))
    );
  }

  session.clear();
  return router.createUrlTree(['/auth/login']);
};
