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
  <div class="mx-auto max-w-2xl p-4">
    <h1 class="text-lg font-semibold">Profile</h1>

    <div class="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
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

        <div class="flex items-center gap-2">
          <button type="submit" class="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-60" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
        </div>
      </form>
    </div>
  </div>
  `
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);

  form = this.fb.nonNullable.group({ name: ['', [Validators.required]] });
  saving = signal(false);

  uid = signal(this.session.user()?.uid || '');
  email = signal(this.session.user()?.email || '');

  constructor() {
    const n = this.session.user()?.name || '';
    this.form.patchValue({ name: n });
  }

  onSave() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.users.updateProfile({ name: this.form.controls.name.value }).subscribe({
      next: (res) => {
        // update session user name
        const u = this.session.user() || {};
        this.session.setUser({ ...u, name: res.user?.name || this.form.controls.name.value });
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
