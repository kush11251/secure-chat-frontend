import { Injectable, inject, signal } from '@angular/core';
import { ChatService, ChatDto } from '../services/chat.service';
import { MessageService, MessageDto } from '../services/message.service';
import { WebsocketService } from '../services/websocket.service';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chatsApi = inject(ChatService);
  private readonly msgApi = inject(MessageService);
  private readonly ws = inject(WebsocketService);
  private readonly session = inject(SessionStore);

  chats = signal<ChatDto[]>([]);
  currentChat = signal<ChatDto | null>(null);
  messages = signal<MessageDto[]>([]);
  loading = signal(false);

  async openDirect(otherUserId: string) {
    this.loading.set(true);
    this.chatsApi.getOrCreateDirect(otherUserId).subscribe({
      next: (res) => {
        this.openChat(res.chat);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openChat(chat: ChatDto) {
    const prev = this.currentChat();
    if (prev?._id) this.ws.leaveChat(prev._id);
    this.currentChat.set(chat);
    this.ws.joinChat(chat._id);
    this.loadMessages(chat._id);
  }

  loadMessages(chatId: string) {
    this.loading.set(true);
    this.msgApi.getMessages(chatId, 50).subscribe({
      next: (res) => {
        // ensure incoming list has no duplicates (defensive)
        const list = (res.messages || []) as MessageDto[];
        const seen = new Set<string>();
        const deduped = list.filter(m => {
          if (!m || !m._id) return true;
          if (seen.has(m._id)) return false;
          seen.add(m._id);
          return true;
        });
        this.messages.set(deduped);
        this.loading.set(false);
        this.msgApi.markRead(chatId).subscribe();
        // For direct chats, mark incoming messages as delivered (quick socket notify)
        const cur = this.currentChat();
        if (cur && !cur.isGroup) {
          const myId = (this.session.user() as any)?.id || (this.session.user() as any)?._id;
          const toDeliver = (res.messages || []).filter((m: MessageDto) => m && m.sender && String(m.sender._id) !== String(myId) && (m.status === undefined || m.status === 'none')).map((m: MessageDto) => m._id);
          if (toDeliver.length) {
            this.ws.emit('message:delivered', { chatId, messageIds: toDeliver });
            // also call REST as a fallback
            this.msgApi.markDeliveredBulk(chatId, toDeliver).subscribe({});
          }
        }
      },
      error: () => this.loading.set(false)
    });
  }

  sendMessage(content: string) {
    const chatId = this.currentChat()?._id;
    if (!chatId || !content.trim()) return;
    // Optimistically append a temporary message so the UI can scroll immediately.
    const me = this.session.user() as any;
    const myId = me?.id || me?._id || '';
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const tempMsg: MessageDto = {
      _id: tempId,
      chatId,
      sender: { _id: myId, uid: me?.uid || '', name: me?.name || 'You', avatarUrl: me?.avatarUrl },
      type: 'text',
      content,
      createdAt: new Date().toISOString(),
      status: 'none'
    };
    this.messages.update(list => [...list, tempMsg]);

    this.msgApi.sendMessage(chatId, content).subscribe({
      next: (res) => {
        // Replace the temporary message with the server-provided one (or append if not found).
        // If the server message already exists (e.g. socket delivered it first), remove the temp entry.
        const serverMsg = res.message as MessageDto;
        this.messages.update(list => {
          const existsServer = list.some(m => m._id === serverMsg._id);
          if (existsServer) {
            return list.filter(m => m._id !== tempId);
          }
          const idx = list.findIndex(m => m._id === tempId);
          if (idx >= 0) {
            list[idx] = serverMsg;
            return [...list];
          }
          return [...list, serverMsg];
        });
      },
      error: () => {
        // On error, leave the temp message in place (could mark failed in future)
      }
    });
  }

  addIncoming(msg: { chatId: string; message: MessageDto }) {
    // Add message to current chat view if open, with defensive deduplication.
    if (this.currentChat()?._id === msg.chatId) {
      this.messages.update(list => {
        const incoming = msg.message;
        // If an optimistic temp message exists that matches this incoming message
        // (same sender + same content + nearby createdAt), replace it to avoid duplicates.
        const tempIdx = list.findIndex(m => m._id?.toString().startsWith('tmp-')
          && m.content === incoming.content
          && String(m.sender._id || m.sender.id || '') === String(incoming.sender._id || incoming.sender.id || '')
          && m.createdAt && incoming.createdAt
          && Math.abs(new Date(m.createdAt).getTime() - new Date(incoming.createdAt).getTime()) < 5000
        );
        if (tempIdx >= 0) {
          list[tempIdx] = incoming;
          return [...list];
        }

        const existsById = incoming._id && list.some(m => m._id === incoming._id);
        const existsByContent = list.some(m => {
          if (!m.createdAt || !incoming.createdAt) return false;
          return String(m.sender._id || m.sender.id || '') === String(incoming.sender._id || incoming.sender.id || '')
            && m.createdAt === incoming.createdAt
            && (m.content || '') === (incoming.content || '')
            && (m.mediaUrl || '') === (incoming.mediaUrl || '');
        });
        if (existsById || existsByContent) return list;
        return [...list, incoming];
      });
    }
    // if message is from other user, mark delivered (device received it)
    const myId = (this.session.user() as any)?.id || (this.session.user() as any)?._id;
    if (msg.message && msg.message.sender && String(msg.message.sender._id) !== String(myId)) {
      const id = msg.message._id;
      this.ws.emit('message:delivered', { messageId: id });
    }
    // refresh chats list to reflect latest message ordering
    this.loadChats();
  }

  updateMessageStatus(payload: { chatId: string; messageIds: string[]; status: 'none'|'delivered'|'seen'; userId?: string }) {
    if (!payload || !payload.messageIds || !payload.messageIds.length) return;
    this.messages.update(list => list.map(m => {
      if (payload.messageIds.includes(m._id)) return { ...m, status: payload.status };
      return m;
    }));
    // refresh chats to update unread counts if necessary
    this.loadChats();
  }

  applyReactionUpdate(payload: { messageId: string; userId: string; emoji: string | null }) {
    this.messages.update(list => list.map(m => {
      if (m._id !== payload.messageId) return m;
      const reactions = [...(m.reactions || [])];
      const idx = reactions.findIndex(r => String((r.user && (r.user._id || r.user)) || '') === String(payload.userId));
      if (payload.emoji) {
        if (idx >= 0) reactions[idx] = { ...reactions[idx], emoji: payload.emoji };
        else reactions.push({ user: { _id: payload.userId }, emoji: payload.emoji });
      } else {
        if (idx >= 0) reactions.splice(idx, 1);
      }
      return { ...m, reactions };
    }));
  }

  addReactionToMessage(messageId: string, emoji: string) {
    this.msgApi.addReaction(messageId, emoji).subscribe();
  }

  removeReactionFromMessage(messageId: string) {
    this.msgApi.removeReaction(messageId).subscribe();
  }

  uploadMedia(file: File) {
    const chatId = this.currentChat()?._id;
    if (!chatId || !file) return;
    const type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
    this.msgApi.uploadMedia(chatId, file, type).subscribe({
      next: (res) => this.messages.update(list => [...list, res.message])
    });
  }

  loadChats() {
    this.chatsApi.listChats().subscribe({ next: (res) => this.chats.set(res.chats || []) });
  }
}
