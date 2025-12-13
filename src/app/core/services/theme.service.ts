import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  mode = signal<'light' | 'dark'>(this.read());

  private read(): 'light' | 'dark' {
    try {
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
      if (v === 'dark' || v === 'light') return v;
    } catch {}
    return 'light';
  }

  init() {
    const root = document.documentElement;
    const m = this.mode();
    if (m === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  toggle() {
    const next = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(next);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('theme', next); } catch {}
    this.init();
  }
}
