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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
    <div class="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-slate-50 shadow-2xl shadow-black/50">
      <h1 class="text-lg font-semibold">Settings</h1>

      <div class="mt-4 grid gap-4">
        <!-- Theme -->
        <section class="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium">Appearance</div>
              <div class="text-xs text-slate-400">Switch between Light and Dark mode.</div>
            </div>
            <button class="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-900/80" (click)="toggleTheme()">
              Toggle {{ theme.mode() === 'dark' ? 'Light' : 'Dark' }}
            </button>
          </div>
        </section>

        <!-- Connectivity -->
        <section class="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium">Connectivity</div>
              <div class="text-xs text-slate-400">API and WebSocket diagnostic.</div>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span
                class="px-2 py-1 rounded"
                [ngClass]="
                  wsSvc.connected()
                    ? 'bg-emerald-100 text-emerald-700'
                    : (wsSvc.connecting() ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')
                "
              >
                WS: {{ wsSvc.connected() ? 'connected' : (wsSvc.connecting() ? 'connecting' : 'down') }}
              </span>
              <button class="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-900/80" (click)="ping()">Ping</button>
            </div>
          </div>
          <div class="mt-2 text-xs text-slate-400" *ngIf="lastPing()">Last ping: {{ lastPing() }} ms</div>
        </section>

        <!-- Notifications token -->
        <section class="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div class="text-sm font-medium">Notifications</div>
          <form [formGroup]="form" class="mt-2 flex items-center gap-2" (ngSubmit)="saveToken()">
            <input
              class="w-full rounded-md border border-slate-700 bg-slate-900/80 p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Notification token"
              formControlName="token"
            />
            <button class="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700" type="submit">Save</button>
          </form>
        </section>
      </div>
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
