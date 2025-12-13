import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem { id: number; message: string; kind: ToastKind }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastItem[]>([]);
  private seq = 0;

  show(message: string, kind: ToastKind = 'info', timeout = 3000) {
    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, message, kind }]);
    if (timeout > 0) setTimeout(() => this.dismiss(id), timeout);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string) { this.show(msg, 'error', 5000); }
  info(msg: string) { this.show(msg, 'info'); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
