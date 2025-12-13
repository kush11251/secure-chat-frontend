import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="mx-auto max-w-2xl p-4">
    <h1 class="text-lg font-semibold">Settings</h1>

    <div class="mt-4 grid gap-4">
      <!-- Theme -->
      <section class="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">Appearance</div>
            <div class="text-xs text-neutral-500">Switch between Light and Dark mode.</div>
          </div>
          <button class="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" (click)="toggleTheme()">Toggle {{ theme.mode() === 'dark' ? 'Light' : 'Dark' }}</button>
        </div>
      </section>

      <!-- Connectivity -->
      <section class="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">Connectivity</div>
            <div class="text-xs text-neutral-500">API and WebSocket diagnostic.</div>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-2 py-1 rounded" [ngClass]="wsSvc.connected() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">WS: {{ wsSvc.connected() ? 'connected' : 'down' }}</span>
            <button class="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800" (click)="ping()">Ping</button>
          </div>
        </div>
        <div class="mt-2 text-xs text-neutral-500" *ngIf="lastPing()">Last ping: {{ lastPing() }} ms</div>
      </section>

      <!-- Notifications token -->
      <section class="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <div class="text-sm font-medium">Notifications</div>
        <form [formGroup]="form" class="mt-2 flex items-center gap-2" (ngSubmit)="saveToken()">
          <input class="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 text-sm" placeholder="Notification token" formControlName="token" />
          <button class="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700" type="submit">Save</button>
        </form>
      </section>
    </div>
  </div>
  `
})
export class SettingsComponent {
  readonly theme = inject(ThemeService);
  readonly wsSvc = inject(WebsocketService);
  private readonly userApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({ token: [''] });
  lastPing = signal<number | null>(null);

  toggleTheme() { this.theme.toggle(); }

  ping() {
    const start = Date.now();
    this.wsSvc.connect();
    const sub = this.wsSvc.on<any>('pong:server').subscribe({
      next: () => { this.lastPing.set(Date.now() - start); sub.unsubscribe(); }
    });
    this.wsSvc.emit('ping:client');
  }

  saveToken() {
    const token = this.form.controls.token.value.trim();
    if (!token) return;
    this.userApi.updateNotificationsToken(token).subscribe({
      next: () => this.toast.success('Notifications token saved'),
      error: (e) => this.toast.error(e?.error?.message || 'Failed to save token')
    });
  }
}
