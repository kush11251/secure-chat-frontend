import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginDto { email: string; password: string }
export interface RegisterDto { name: string; email: string; password: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl + '/auth';

  login(payload: LoginDto): Observable<{ user: any; tokens: { accessToken: string; refreshToken: string } }> {
    return this.http
      .post<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(`${this.base}/login`, payload, {
        withCredentials: true
      })
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.tokens.accessToken);
          localStorage.setItem('refresh_token', res.tokens.refreshToken);
        })
      );
  }

  register(payload: RegisterDto) {
    return this.http
      .post<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(`${this.base}/register`, payload, {
        withCredentials: true
      })
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.tokens.accessToken);
          localStorage.setItem('refresh_token', res.tokens.refreshToken);
        })
      );
  }

  refresh() {
    const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    return this.http
      .post<{ accessToken: string }>(
        `${this.base}/refresh`,
        refreshToken ? { refreshToken } : {},
        { withCredentials: true }
      )
      .pipe(tap((res) => localStorage.setItem('access_token', res.accessToken)));
  }

  logout() {
    const token = localStorage.getItem('access_token');

    return this.http.post(
      `${this.base}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }
    ).pipe(
      // only clear storage after the request succeeds
      tap(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
    );
  }
}
