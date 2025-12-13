import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'sc-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="pointer-events-none fixed right-3 top-3 z-[100] space-y-2">
    <div *ngFor="let t of toasts()" class="pointer-events-auto min-w-[240px] max-w-sm rounded-md border p-3 shadow bg-white dark:bg-neutral-900"
         [ngClass]="{
           'border-emerald-300 text-emerald-800': t.kind === 'success',
           'border-red-300 text-red-800': t.kind === 'error',
           'border-neutral-300 text-neutral-800 dark:text-neutral-100': t.kind === 'info'
         }">
      <div class="flex items-start gap-2">
        <div class="mt-0.5 text-lg">{{ t.kind === 'success' ? '✔' : t.kind === 'error' ? '⚠' : 'ℹ' }}</div>
        <div class="flex-1 text-sm">{{ t.message }}</div>
        <button class="rounded px-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" (click)="dismiss(t.id)">✕</button>
      </div>
    </div>
  </div>
  `
})
export class ToastHostComponent {
  private readonly toast = inject(ToastService);
  toasts = this.toast.toasts.asReadonly();
  dismiss = (id: number) => this.toast.dismiss(id);
}
