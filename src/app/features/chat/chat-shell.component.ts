import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../../core/store/session.store';
import { RouterLink } from '@angular/router';
import { signal, computed, inject as ngInject } from '@angular/core';
import { WebsocketService } from '../../core/services/websocket.service';
import { ContactsStore } from '../../core/store/contacts.store';
import { AddContactModalComponent } from '../contacts/add-contact.modal';
import { ToastService } from '../../core/services/toast.service';
import { ChatStore } from '../../core/store/chat.store';
import { UserService } from '../../core/services/user.service';
import { ChatService } from '../../core/services/chat.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, AddContactModalComponent],
  template: `
  <div class="h-screen w-screen bg-neutral-50 text-neutral-900">
    <div class="flex h-full">
      <aside class="hidden md:flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div class="px-4 py-4 border-b border-neutral-200">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-semibold">SC</div>
            <div>
              <div class="text-sm font-semibold">SecureChat</div>
              <div class="text-xs text-neutral-500">Developer Edition</div>
            </div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-4">
          <div>
            <div class="px-2 text-xs font-semibold text-neutral-500">PINNED</div>
            <nav class="mt-1 space-y-1">
              <a *ngFor="let ch of pinnedChats()" class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 cursor-pointer" (click)="openChat(ch)">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px]">{{ chatInitial(ch) }}</span>
                <span class="min-w-0 flex-1">
                  <div class="truncate">{{ chatTitle(ch) }}</div>
                  <div class="truncate text-[10px] text-neutral-500">{{ lastMessagePreview(ch) }}</div>
                </span>
                <span class="ml-auto inline-flex items-center rounded-full bg-emerald-100 px-2 text-[10px] text-emerald-700">E2E</span>
              </a>
              <div *ngIf="!pinnedChats().length" class="px-2 py-1.5 text-xs text-neutral-500">No pinned chats</div>
            </nav>
          </div>
          <div>
            <div class="px-2 text-xs font-semibold text-neutral-500">CHATS</div>
            <nav class="mt-1 space-y-1">
              <a *ngFor="let ch of otherChats()" class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 cursor-pointer" (click)="openChat(ch)">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px]">{{ chatInitial(ch) }}</span>
                <span class="min-w-0 flex-1">
                  <div class="truncate">{{ chatTitle(ch) }}</div>
                  <div class="truncate text-[10px] text-neutral-500">{{ lastMessagePreview(ch) }}</div>
                </span>
              </a>
              <div *ngIf="!otherChats().length" class="px-2 py-1.5 text-xs text-neutral-500">No chats yet</div>
            </nav>
          </div>
          <div>
            <div class="flex items-center justify-between px-2">
              <div class="text-xs font-semibold text-neutral-500">DIRECT MESSAGES</div>
              <button class="rounded-md border border-neutral-200 px-2 py-0.5 text-xs hover:bg-neutral-50" (click)="openAddContact.set(true)">Add</button>
            </div>
            <nav class="mt-1 space-y-1">
              <a *ngFor="let c of contacts.contacts()" class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 cursor-pointer" (click)="openDm(c)">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px]">{{ (c.name || c.uid)[0] }}</span>
                <span class="truncate">{{ c.name }} <span class="text-neutral-400">({{ c.uid }})</span></span>
                <span class="ml-auto h-2 w-2 rounded-full" [ngClass]="c.status === 'online' ? 'bg-emerald-500' : 'bg-neutral-300'"></span>
                <button class="ml-2 rounded-md border border-neutral-200 px-2 py-0.5 text-[10px] hover:bg-neutral-50" (click)="removeContact(c, $event)">Remove</button>
              </a>
              <div *ngIf="!contacts.contacts().length" class="px-2 py-1.5 text-xs text-neutral-500">No contacts yet</div>
            </nav>
          </div>
        </div>
        <div class="px-4 py-3 border-t border-neutral-200">
          <div class="mb-2 px-2 text-xs font-semibold text-neutral-500">PROFILE</div>
          <div class="flex items-center gap-3 px-2">
            <span class="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-xs">{{ initials() }}</span>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium">{{ displayName() }}</div>
              <div class="truncate text-xs text-neutral-500">{{ email() || '—' }}</div>
            </div>
            <span class="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500">
              <span class="h-2 w-2 rounded-full" [ngClass]="status() === 'online' ? 'bg-emerald-500' : 'bg-neutral-300'"></span>
              {{ status() }}
            </span>
          </div>
        </div>
      </aside>

      <main class="flex-1 flex flex-col">
        <header class="relative flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="text-lg font-semibold">{{ title() }}</div>
            <span class="text-xs rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-700">End-to-End Encrypted</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="px-2 py-1 rounded bg-neutral-100">Env: <b>{{ env }}</b></span>
            <span class="px-2 py-1 rounded" [ngClass]="health === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">API: {{ health || '...' }}</span>
            <span class="px-2 py-1 rounded" [ngClass]="ws.connected() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">WS: {{ ws.connected() ? 'connected' : 'down' }}</span>
            <div class="relative">
              <button class="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1 hover:bg-neutral-50" (click)="toggleMenu()">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px]">{{ initials() }}</span>
                <span class="hidden sm:inline text-neutral-800">{{ displayName() }}</span>
                <svg class="h-3 w-3 text-neutral-500" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
              <div *ngIf="menuOpen()" class="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-md border border-neutral-200 bg-white shadow">
                <a routerLink="/profile" class="block px-3 py-2 text-sm hover:bg-neutral-50">Profile</a>
                <a routerLink="/settings" class="block px-3 py-2 text-sm hover:bg-neutral-50">Settings</a>
                <a routerLink="/auth/logout" class="block px-3 py-2 text-sm hover:bg-neutral-50">Logout</a>
              </div>
            </div>
          </div>
        </header>

        <section class="flex-1 overflow-y-auto p-4">
          <div class="mx-auto max-w-4xl space-y-6">
            <!-- Messages -->
            <div *ngFor="let m of chat.messages()" class="flex items-start gap-3">
              <div class="h-8 w-8 shrink-0 rounded-full bg-neutral-200 grid place-items-center text-[10px]">{{ m.sender?.name?.[0] || '?' }}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-semibold">{{ m.sender?.name || m.sender?.uid || 'User' }}</span>
                  <span class="text-xs text-neutral-500">{{ m.createdAt | date:'shortTime' }}</span>
                </div>
                <div class="mt-1 text-sm whitespace-pre-wrap">{{ m.content }}</div>
                <div *ngIf="m.mediaUrl" class="mt-2">
                  <img *ngIf="m.type === 'image'" [src]="m.mediaUrl" class="max-h-48 rounded-md border border-neutral-200" />
                  <video *ngIf="m.type === 'video'" [src]="m.mediaUrl" controls class="max-h-48 rounded-md border border-neutral-200"></video>
                  <a *ngIf="m.type === 'file'" [href]="m.mediaUrl" target="_blank" class="text-xs text-brand-600 underline">Download file</a>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <button class="rounded px-1 text-xs hover:bg-neutral-100" (click)="react(m, '👍')">👍</button>
                  <button class="rounded px-1 text-xs hover:bg-neutral-100" (click)="react(m, '❤️')">❤️</button>
                  <button class="rounded px-1 text-xs hover:bg-neutral-100" (click)="react(m, '😂')">😂</button>
                  <div class="ml-2 text-[11px] text-neutral-500" *ngIf="(m.reactions || []).length">
                    <span *ngFor="let r of m.reactions" class="mr-1 inline-flex items-center gap-1 rounded bg-neutral-100 px-1">{{ r.emoji }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="border-t border-neutral-200 bg-white p-3">
          <div class="mx-auto max-w-4xl">
            <div class="flex items-end gap-2">
              <textarea rows="2" class="w-full rounded-md border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Type a message..." [value]="draft()" (input)="onDraftInput($event)" (keydown.enter)="onEnter($event)"></textarea>
              <button class="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700" (click)="send()">Send</button>
              <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)"/>
              <button class="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50" (click)="fileInput.click()">Upload</button>
            </div>
          </div>
        </footer>
      </main>

      <aside class="hidden lg:flex w-80 shrink-0 flex-col border-l border-neutral-200 bg-white p-4">
        <div class="text-sm font-semibold">Details</div>
        <div class="mt-3 text-xs text-neutral-500">Channel description and members</div>
        <div class="mt-3" *ngIf="chat.currentChat()?.isGroup">
          <div class="text-xs font-semibold text-neutral-500">Group Management</div>
          <div class="mt-2 space-y-2">
            <div class="flex items-center gap-2">
              <input class="w-full rounded-md border border-neutral-300 p-1 text-xs" [value]="groupName()" (input)="onGroupNameInput($event)" placeholder="Group name"/>
              <button class="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50" (click)="renameGroup()">Rename</button>
            </div>
            <div>
              <div class="text-xs text-neutral-500 mb-1">Members</div>
              <div class="space-y-1">
                <div *ngFor="let m of chat.currentChat()?.members" class="flex items-center gap-2 text-xs">
                  <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[10px]">{{ (m.name || m.uid)[0] }}</span>
                  <span class="truncate">{{ m.name }} <span class="text-neutral-400">({{ m.uid }})</span></span>
                  <button class="ml-auto rounded-md border border-neutral-300 px-2 py-0.5 hover:bg-neutral-50" (click)="removeMember(m._id)">Remove</button>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input class="w-full rounded-md border border-neutral-300 p-1 text-xs" [value]="addUid()" (input)="onAddUidInput($event)" placeholder="Add member by UID"/>
              <button class="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50" (click)="addMemberByUID()">Add</button>
            </div>
          </div>
        </div>
        <div class="mt-3" *ngIf="!chat.currentChat() || !chat.currentChat()?.isGroup">
          <div class="text-xs font-semibold text-neutral-500">Create Group</div>
          <div class="mt-2 space-y-2">
            <input class="w-full rounded-md border border-neutral-300 p-1 text-xs" [value]="newGroupName()" (input)="onNewGroupNameInput($event)" placeholder="Group name"/>
            <input class="w-full rounded-md border border-neutral-300 p-1 text-xs" [value]="newGroupUIDs()" (input)="onNewGroupUIDsInput($event)" placeholder="Member UIDs (comma separated)"/>
            <button class="rounded-md bg-brand-600 px-3 py-2 text-white text-xs hover:bg-brand-700" (click)="createGroup()">Create</button>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <sc-add-contact-modal [open]="openAddContact()" (closed)="openAddContact.set(false)"></sc-add-contact-modal>
  `
})
export class ChatShellComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly session = ngInject(SessionStore);
  readonly ws = ngInject(WebsocketService);
  readonly contacts = ngInject(ContactsStore);
  private readonly toast = ngInject(ToastService);
  readonly chat = ngInject(ChatStore);
  private readonly userApi = ngInject(UserService);
  private readonly chatApi = ngInject(ChatService);

  env = environment.envName;
  health: string | null = null;

  menuOpen = signal(false);
  toggleMenu = () => this.menuOpen.set(!this.menuOpen());
  displayName = computed(() => this.session.user()?.name || 'User');
  initials = computed(() => {
    const name = this.session.user()?.name || 'U';
    const parts = name.split(' ');
    const fn = parts[0]?.[0] || '';
    const ln = parts[1]?.[0] || '';
    return (fn + ln).toUpperCase() || name.slice(0,2).toUpperCase();
  });
  email = computed(() => this.session.user()?.email || '');
  status = computed(() => this.session.user()?.status || 'offline');
  openAddContact = signal(false);
  draft = signal('');
  someoneTyping = signal(false);
  private typingTimer: any;
  myId = computed(() => (this.session.user() as any)?.id || (this.session.user() as any)?._id || '');
  pinnedChatIds = computed(() => new Set<string>(((this.session.user() as any)?.pinnedChats || []).map((id: any) => String(id))));
  pinnedChats = computed(() => {
    const list = this.chat.chats() || [];
    const pinned = list.filter(c => this.pinnedChatIds().has(String(c._id)));
    return this.sortChats(pinned);
  });
  otherChats = computed(() => {
    const list = this.chat.chats() || [];
    const other = list.filter(c => !this.pinnedChatIds().has(String(c._id)));
    return this.sortChats(other);
  });
  title = computed(() => {
    const c = this.chat.currentChat();
    if (!c) return 'Select a chat';
    if (c.isGroup) return c.groupName || 'Group';
    const me = this.myId();
    const other = (c.members || []).find(m => String(m._id) !== String(me));
    return other?.name || other?.uid || 'Direct Message';
  });

  channels: string[] = ['frontend-team', 'devops-alerts', 'code-review', 'infrastructure', 'general', 'random'];
  groupName = signal('');
  addUid = signal('');
  newGroupName = signal('');
  newGroupUIDs = signal('');

  ngOnInit(): void {
    this.api.getHealth().subscribe({ next: (res) => (this.health = res.status), error: () => (this.health = 'down') });
    // Initialize websocket after entering chat (auth guard ensures token)
    this.ws.connect();
    this.ws.on<any>('hello').subscribe({ next: (d) => console.debug('WS hello', d) });
    this.ws.on<any>('pong:server').subscribe({ next: (d) => console.debug('WS pong', d) });
    // chats
    this.chat.loadChats();
    // contacts
    this.contacts.load();
    this.ws.on<any>('contact:added').subscribe({ next: () => { this.contacts.load(); this.toast.success('Contact updated'); } });
    this.ws.on<any>('contact:removed').subscribe({ next: () => { this.contacts.load(); this.toast.info('Contact removed'); } });
    // presence
    this.ws.on<{ userId: string }>('user:online').subscribe({ next: (e) => this.contacts.updatePresenceById(e.userId, 'online') });
    this.ws.on<{ userId: string }>('user:offline').subscribe({ next: (e) => this.contacts.updatePresenceById(e.userId, 'offline') });
    // incoming messages and typing
    this.ws.on<any>('message:receive').subscribe({ next: (e) => this.chat.addIncoming(e) });
    this.ws.on<{ messageId: string; userId: string; emoji: string | null }>('reaction:update').subscribe({ next: (e) => this.chat.applyReactionUpdate(e) });
    this.ws.on<{ chatId: string; userId: string }>('typing:start').subscribe({ next: (e) => {
      if (this.chat.currentChat()?._id === e.chatId && String(e.userId) !== String(this.myId())) this.someoneTyping.set(true);
    }});
    this.ws.on<{ chatId: string; userId: string }>('typing:stop').subscribe({ next: (e) => {
      if (this.chat.currentChat()?._id === e.chatId && String(e.userId) !== String(this.myId())) this.someoneTyping.set(false);
    }});
    this.ws.on<any>('group:update').subscribe({ next: () => this.chat.loadChats() });
  }

  sortChats(list: any[]) {
    return [...list].sort((a, b) => {
      const ad = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bd = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bd - ad;
    });
  }

  chatTitle(c: any) {
    if (c.isGroup) return c.groupName || 'Group';
    const me = this.myId();
    const other = (c.members || []).find((m: any) => String(m._id) !== String(me));
    return other?.name || other?.uid || 'Direct';
  }

  chatInitial(c: any) {
    const t = this.chatTitle(c) || '?';
    return t[0]?.toUpperCase() || '?';
  }

  lastMessagePreview(c: any) {
    const lm = c.lastMessage;
    if (!lm) return 'No messages yet';
    if (lm.type === 'text') return lm.content || '—';
    if (lm.type === 'image') return '[image]';
    if (lm.type === 'video') return '[video]';
    if (lm.type === 'file') return '[file]';
    return `[${lm.type}]`;
  }

  openChat(c: any) {
    this.chat.openChat(c);
    if (c?.isGroup) this.groupName.set(c.groupName || '');
  }

  openDm(c: any) {
    const otherId = String((c && (c._id || c.id)) || '');
    if (otherId) this.chat.openDirect(otherId);
  }

  onDraftInput(ev: Event) {
    const val = (ev.target as HTMLTextAreaElement).value;
    this.draft.set(val);
    const chatId = this.chat.currentChat()?._id;
    if (!chatId) return;
    this.ws.emit('typing:start', { chatId });
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.ws.emit('typing:stop', { chatId }), 800);
  }

  onEnter(ev: any) {
    if (ev.shiftKey) return; // allow newline with Shift+Enter
    ev.preventDefault();
    this.send();
  }

  send() {
    const text = this.draft().trim();
    if (!text) return;
    this.chat.sendMessage(text);
    this.draft.set('');
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.chat.uploadMedia(file);
    input.value = '';
  }

  react(m: any, emoji: string) {
    const myId = this.myId();
    const existing = (m.reactions || []).find((r: any) => String((r.user && (r.user._id || r.user)) || '') === String(myId));
    if (existing && existing.emoji === emoji) {
      this.chat.removeReactionFromMessage(m._id);
    } else {
      this.chat.addReactionToMessage(m._id, emoji);
    }
  }

  removeContact(c: any, ev: MouseEvent) {
    ev.stopPropagation();
    const uid = c?.uid;
    if (!uid) return;
    this.userApi.removeContactByUID(uid).subscribe({
      next: () => { this.contacts.removeByUid(uid); this.toast.info('Contact removed'); },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to remove')
    });
  }

  renameGroup() {
    const chatId = this.chat.currentChat()?._id;
    const name = this.groupName().trim();
    if (!chatId || !name) return;
    this.chatApi.updateGroup(chatId, { groupName: name }).subscribe({
      next: (res) => { this.chat.currentChat.set(res.chat); this.toast.success('Group renamed'); }
    });
  }

  async addMemberByUID() {
    const chatId = this.chat.currentChat()?._id;
    const uid = this.addUid().trim();
    if (!chatId || !uid) return;
    try {
      const found = await firstValueFrom(this.userApi.searchByUID(uid));
      const id = (found.user && (found.user._id || found.user.id)) as string;
      if (!id) { this.toast.error('User not found'); return; }
      this.chatApi.addMembers(chatId, [id]).subscribe({
        next: (res) => { this.chat.currentChat.set(res.chat); this.addUid.set(''); this.toast.success('Member added'); }
      });
    } catch {
      this.toast.error('Failed to add member');
    }
  }

  removeMember(memberId: string) {
    const chatId = this.chat.currentChat()?._id;
    if (!chatId || !memberId) return;
    this.chatApi.removeMember(chatId, memberId).subscribe({
      next: (res) => { this.chat.currentChat.set(res.chat); this.toast.info('Member removed'); }
    });
  }

  async createGroup() {
    const name = this.newGroupName().trim();
    const uids = this.newGroupUIDs().split(',').map(s => s.trim()).filter(Boolean);
    if (!name || !uids.length) return;
    try {
      const ids: string[] = [];
      for (const uid of uids) {
        const found = await firstValueFrom(this.userApi.searchByUID(uid));
        const id = (found.user && (found.user._id || found.user.id)) as string;
        if (id) ids.push(id);
      }
      if (!ids.length) { this.toast.error('No valid members'); return; }
      this.chatApi.createGroup(name, ids).subscribe({
        next: (res) => { this.chat.openChat(res.chat); this.newGroupName.set(''); this.newGroupUIDs.set(''); this.toast.success('Group created'); }
      });
    } catch {
      this.toast.error('Failed to create group');
    }
  }

  onGroupNameInput(ev: any) { this.groupName.set((ev?.target?.value || '').trim()); }
  onAddUidInput(ev: any) { this.addUid.set((ev?.target?.value || '').trim()); }
  onNewGroupNameInput(ev: any) { this.newGroupName.set((ev?.target?.value || '').trim()); }
  onNewGroupUIDsInput(ev: any) { this.newGroupUIDs.set((ev?.target?.value || '').trim()); }
}
