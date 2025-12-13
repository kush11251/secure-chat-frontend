import { Injectable, inject, signal } from '@angular/core';
import { ChatService, ChatDto } from '../services/chat.service';
import { MessageService, MessageDto } from '../services/message.service';
import { WebsocketService } from '../services/websocket.service';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chatsApi = inject(ChatService);
  private readonly msgApi = inject(MessageService);
  private readonly ws = inject(WebsocketService);

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
        this.messages.set(res.messages || []);
        this.loading.set(false);
        this.msgApi.markRead(chatId).subscribe();
      },
      error: () => this.loading.set(false)
    });
  }

  sendMessage(content: string) {
    const chatId = this.currentChat()?._id;
    if (!chatId || !content.trim()) return;
    this.msgApi.sendMessage(chatId, content).subscribe({
      next: (res) => {
        this.messages.update(list => [...list, res.message]);
      }
    });
  }

  addIncoming(msg: { chatId: string; message: MessageDto }) {
    if (this.currentChat()?._id === msg.chatId) {
      this.messages.update(list => [...list, msg.message]);
    }
    // refresh chats list to reflect latest message ordering
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
