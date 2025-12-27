import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/store/session.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
    <div class="w-full max-w-4xl grid gap-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/50 md:grid-cols-[0.95fr,1.05fr]">
      <section class="hidden flex-col justify-between text-slate-200 md:flex">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Create your encrypted workspace
          </div>
          <h1 class="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Create a SecureChat account</h1>
          <p class="mt-2 text-sm text-slate-300">
            Use your new workspace to collaborate in real time with end‑to‑end encryption, presence and typing
            indicators.
          </p>
        </div>
        <div class="mt-6 space-y-2 text-xs text-slate-300">
          <p>Tips for a strong password:</p>
          <ul class="list-disc space-y-1 pl-4">
            <li>At least 12 characters</li>
            <li>Mix of letters, numbers and symbols</li>
            <li>Avoid re‑using passwords from other sites</li>
          </ul>
        </div>
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-950/90 p-5 text-slate-50">
        <div class="mb-4 flex items-center gap-2">
          <div class="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-lg shadow-brand-500/40">SC</div>
          <div>
            <div class="text-sm font-semibold">Create account</div>
            <div class="text-xs text-slate-400">Start a new SecureChat workspace</div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-300">Name</label>
              <input
                formControlName="name"
                type="text"
                class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Your name"
              />
              <div class="mt-1 text-[11px] text-red-400" *ngIf="form.get('name')?.touched && form.get('name')?.invalid">
                Name is required.
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-300">Email</label>
              <input
                formControlName="email"
                type="email"
                class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="you@example.com"
              />
              <div class="mt-1 text-[11px] text-red-400" *ngIf="form.get('email')?.touched && form.get('email')?.invalid">
                Please enter a valid email.
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-300">Password</label>
              <div class="relative mt-1">
                <input
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="w-full rounded-md border border-slate-700 bg-slate-900/80 p-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] text-slate-400 hover:text-slate-200"
                  (click)="togglePasswordVisibility()"
                >
                  {{ showPassword() ? 'Hide' : 'Show' }}
                </button>
              </div>
              <div class="mt-1 text-[11px] text-red-400" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">
                Password is required.
              </div>
            </div>
          </div>

          <button
            class="mt-1 w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-500/40 hover:bg-brand-600 disabled:opacity-60"
            type="submit"
            [disabled]="loading() || form.invalid"
          >
            {{ loading() ? 'Creating…' : 'Create account' }}
          </button>

          <div *ngIf="error()" class="mt-2 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
            {{ error() }}
          </div>
        </form>

        <div class="mt-4 text-center text-[11px] text-slate-400">
          Already have an account?
          <a routerLink="/auth/login" class="font-medium text-brand-300 hover:text-brand-200">Sign in</a>
        </div>
      </section>
    </div>
  </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.session.setUser(res.user);
        this.loading.set(false);
        this.router.navigateByUrl('/chat');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'Registration failed');
      }
    });
  }
}
