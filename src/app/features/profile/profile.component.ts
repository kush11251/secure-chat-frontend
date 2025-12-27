import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { SessionStore } from '../../core/store/session.store';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
    <div class="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-slate-50 shadow-2xl shadow-black/50">
      <h1 class="text-lg font-semibold">Profile</h1>

      <div class="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <form [formGroup]="form" class="space-y-4" (ngSubmit)="onSave()">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm text-neutral-600 dark:text-neutral-300">UID</label>
            <input type="text" [value]="uid()" readonly class="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-neutral-700 dark:text-neutral-200" />
          </div>
          <div>
            <label class="block text-sm text-neutral-600 dark:text-neutral-300">Email</label>
            <input type="email" [value]="email()" readonly class="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-neutral-700 dark:text-neutral-200" />
          </div>
        </div>
        <div>
          <label class="block text-sm text-neutral-600 dark:text-neutral-300">Display name</label>
          <input type="text" formControlName="name" class="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 text-neutral-800 dark:text-neutral-100" />
        </div>

        <div class="grid grid-cols-[auto,1fr] items-start gap-4">
          <div class="flex flex-col items-center gap-2">
            <div class="h-16 w-16 overflow-hidden rounded-full bg-slate-800 grid place-items-center text-xs">
              <img *ngIf="currentAvatar()" [src]="currentAvatar()" alt="Avatar" class="h-full w-full object-cover" />
              <span *ngIf="!currentAvatar()">{{ (form.controls.name.value || 'U')[0] }}</span>
            </div>
            <span class="text-[11px] text-slate-400">Preview</span>
          </div>
          <div>
            <label class="block text-sm text-slate-200">Choose an avatar</label>
            <div class="mt-1 grid grid-cols-4 gap-2">
              <button
                type="button"
                *ngFor="let a of presetAvatars"
                class="group relative h-12 w-12 overflow-hidden rounded-full border"
                [ngClass]="isPresetSelected(a) ? 'border-brand-500 ring-2 ring-brand-500' : 'border-slate-700'"
                (click)="selectPreset(a)"
              >
                <img [src]="a" alt="Avatar option" class="h-full w-full object-cover" />
              </button>
            </div>
            <label class="mt-4 block text-sm text-slate-200">Or use a custom URL</label>
            <input
              type="url"
              formControlName="avatarUrl"
              class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://.../avatar.png"
              (input)="currentAvatar.set(form.controls.avatarUrl.value || '')"
            />
            <p class="mt-1 text-[11px] text-slate-400">Pick one of the preset avatars or paste a public image URL.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button type="submit" class="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-60" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
        </div>
      </form>
    </div>
  </div>
  </div>
  `
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    avatarUrl: ['']
  });
  saving = signal(false);

  uid = signal(this.session.user()?.uid || '');
  email = signal(this.session.user()?.email || '');
  currentAvatar = signal(this.session.user()?.avatarUrl || '');

  presetAvatars: string[] = [
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure1',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure2',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure3',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure4',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure5',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure6',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure7',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=secure8'
  ];

  constructor() {
    const u = this.session.user() || {};
    this.form.patchValue({
      name: u.name || '',
      avatarUrl: u.avatarUrl || ''
    });
  }

  selectPreset(url: string) {
    this.form.controls.avatarUrl.setValue(url);
    this.currentAvatar.set(url);
  }

  isPresetSelected(url: string) {
    return this.form.controls.avatarUrl.value === url;
  }

  onSave() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = {
      name: this.form.controls.name.value,
      avatarUrl: this.form.controls.avatarUrl.value || ''
    };
    this.users.updateProfile(payload).subscribe({
      next: (res) => {
        // update session user
        const u = this.session.user() || {};
        this.session.setUser({
          ...u,
          name: res.user?.name || this.form.controls.name.value,
          avatarUrl: res.user?.avatarUrl ?? payload.avatarUrl
        });
        this.currentAvatar.set(this.session.user()?.avatarUrl || '');
        this.saving.set(false);
        this.toast.success('Profile updated');
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(e?.error?.message || 'Failed to update profile');
      }
    });
  }
}
