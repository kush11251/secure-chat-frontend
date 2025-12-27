import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../core/store/session.store';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
    <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
      <!-- Top nav -->
      <header class="flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-2">
          <div class="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-lg shadow-brand-500/40">
            SC
          </div>
          <div class="hidden sm:block">
            <div class="text-sm font-semibold tracking-tight">SecureChat</div>
            <div class="text-xs text-slate-400">End‑to‑end encrypted messaging</div>
          </div>
        </a>
        <nav class="flex items-center gap-3 text-xs sm:text-sm">
          <a routerLink="/auth/login" class="rounded-md px-3 py-1.5 text-slate-200 hover:bg-slate-800/70">Login</a>
          <a routerLink="/auth/register" class="rounded-md bg-brand-500 px-3 py-1.5 text-white shadow-sm shadow-brand-500/40 hover:bg-brand-600">Get started</a>
        </nav>
      </header>

      <!-- Hero -->
      <main class="mt-10 flex flex-1 flex-col gap-10 md:mt-20 md:flex-row md:items-center">
        <section class="flex-1 space-y-6">
          <p class="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 backdrop-blur">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Private by design. Built for developers.
          </p>
          <h1 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Secure, minimal
            <span class="bg-gradient-to-r from-brand-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">real‑time chat</span>
            for your team.
          </h1>
          <p class="max-w-xl text-sm text-slate-300 sm:text-base">
            SecureChat gives you an end‑to‑end encrypted chat experience with typing indicators, reactions,
            groups and rich media — all running on your own backend.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <a
              [routerLink]="primaryCta()"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-500/40 hover:bg-brand-600"
            >
              {{ isAuthed() ? 'Open chat' : 'Create free account' }}
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 10h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                <path d="m10 5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
            <a
              routerLink="/chat"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Live demo workspace
            </a>
          </div>

          <div class="mt-6 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
            <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Privacy first</div>
              <p class="mt-1 text-xs text-slate-300">End‑to‑end encrypted messaging with presence and read receipts.</p>
            </div>
            <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Developer ready</div>
              <p class="mt-1 text-xs text-slate-300">Node.js, MongoDB & Angular — ready to extend and self‑host.</p>
            </div>
            <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Realtime UX</div>
              <p class="mt-1 text-xs text-slate-300">Typing indicators, reactions, group chats and media uploads.</p>
            </div>
          </div>
        </section>

        <!-- Right side preview -->
        <section class="relative mt-4 flex-1 md:mt-0">
          <div class="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-tr from-brand-500/30 via-emerald-400/10 to-sky-500/10 blur-3xl" aria-hidden="true"></div>
          <div class="relative mx-auto w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3 shadow-2xl shadow-black/60 backdrop-blur">
            <div class="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
              <div class="flex items-center gap-2">
                <div class="grid h-7 w-7 place-items-center rounded-full bg-brand-500/90 text-[10px] font-semibold">JD</div>
                <div>
                  <div class="text-xs font-medium">Design sync</div>
                  <div class="text-[10px] text-emerald-400">End‑to‑end encrypted</div>
                </div>
              </div>
              <div class="flex items-center gap-1 text-[10px] text-slate-400">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                online • 3 members
              </div>
            </div>

            <div class="mt-3 space-y-2 text-xs">
              <div class="flex items-start gap-2">
                <div class="grid h-7 w-7 place-items-center rounded-full bg-slate-800 text-[10px]">SC</div>
                <div>
                  <div class="rounded-2xl rounded-tl-sm bg-slate-800 px-3 py-2 text-slate-100 shadow-sm">All traffic here is encrypted before it leaves your browser.</div>
                  <div class="mt-1 flex gap-1 text-[10px] text-slate-400">
                    <span class="rounded-full bg-slate-800/80 px-2 py-0.5">👍 2</span>
                    <span class="rounded-full bg-slate-800/80 px-2 py-0.5">❤️ 1</span>
                  </div>
                </div>
              </div>

              <div class="flex items-start justify-end gap-2">
                <div>
                  <div class="rounded-2xl rounded-br-sm bg-brand-500 px-3 py-2 text-slate-50 shadow-md shadow-brand-500/40">Looks great — let’s roll this out to the whole team.</div>
                  <div class="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                    <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
                    typing…
                  </div>
                </div>
                <div class="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-[10px] font-semibold">YOU</div>
              </div>

              <div class="pt-3">
                <div class="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-400">
                  <span class="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    /join frontend-team
                  </span>
                  <span class="ml-2">Invite teammates with a secure one‑time link.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="mt-10 flex items-center justify-between border-t border-slate-800/70 pt-4 text-[11px] text-slate-500">
          <span>© {{ year }} SecureChat. Self‑hosted realtime chat starter.</span>
        <span class="hidden gap-2 sm:flex">
          <span class="rounded-full bg-slate-900/80 px-2 py-0.5">Node.js</span>
          <span class="rounded-full bg-slate-900/80 px-2 py-0.5">MongoDB</span>
          <span class="rounded-full bg-slate-900/80 px-2 py-0.5">Angular</span>
        </span>
      </footer>
    </div>
  </div>
  `
})
export class LandingComponent {
  private readonly session = inject(SessionStore);
  readonly year = new Date().getFullYear();
  isAuthed = computed(() => this.session.isAuthenticated());
  primaryCta = computed(() => (this.isAuthed() ? '/chat' : '/auth/register'));
}
