import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sc-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/30" (click)="onClose()"></div>
    <div class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900 shadow-xl">
      <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div class="text-sm font-semibold">{{ title }}</div>
        <button class="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" (click)="onClose()">✕</button>
      </div>
      <div class="p-4">
        <ng-content></ng-content>
      </div>
    </div>
  </div>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  onClose() { this.closed.emit(); }
}
