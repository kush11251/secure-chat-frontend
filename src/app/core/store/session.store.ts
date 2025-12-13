import { Injectable, computed, signal } from '@angular/core';

export interface SessionUser {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readUserFromStorage(): SessionUser | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }

  user = signal<SessionUser | null>(this.readUserFromStorage());

  isAuthenticated = computed(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    return !!token;
  });

  setUser(u: SessionUser | null) {
    this.user.set(u);
    try {
      if (typeof localStorage !== 'undefined') {
        if (u) localStorage.setItem('user', JSON.stringify(u));
        else localStorage.removeItem('user');
      }
    } catch {}
  }

  clear() {
    this.setUser(null);
  }
}
