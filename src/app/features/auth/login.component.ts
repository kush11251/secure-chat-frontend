import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/store/session.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center bg-neutral-50">
    <div class="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center gap-2">
        <div class="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-semibold">SC</div>
        <div>
          <div class="text-sm font-semibold">SecureChat</div>
          <div class="text-xs text-neutral-500">Sign in to continue</div>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-neutral-700">Email</label>
          <input formControlName="email" type="email" class="mt-1 w-full rounded-md border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@example.com" />
          <div class="mt-1 text-xs text-red-600" *ngIf="form.get('email')?.touched && form.get('email')?.invalid">Valid email is required</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700">Password</label>
          <input formControlName="password" type="password" class="mt-1 w-full rounded-md border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="••••••••" />
          <div class="mt-1 text-xs text-red-600" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">Password is required</div>
        </div>
        <button class="w-full rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-60" type="submit" [disabled]="loading() || form.invalid">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
        <div class="text-xs text-red-600" *ngIf="error()">{{ error() }}</div>
      </form>

      <div class="mt-4 text-center text-xs">
        No account? <a routerLink="/auth/register" class="text-brand-600 hover:underline">Create one</a>
      </div>
    </div>
  </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.session.setUser(res.user);
        this.loading.set(false);
        this.router.navigateByUrl('/chat');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'Login failed');
      }
    });
  }
}
