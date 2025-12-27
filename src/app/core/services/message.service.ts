import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MessageDto {
  _id: string;
  chatId: string;
  sender: { _id: string; id?: string; uid: string; name: string; avatarUrl?: string };
  type: 'text' | 'image' | 'file' | string;
  content?: string;
  mediaUrl?: string;
  createdAt?: string;
  reactions?: Array<{ user: any; emoji: string }>;
  readBy?: string[];
  status?: 'none' | 'delivered' | 'seen';
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl + '/messages';

  getMessages(chatId: string, limit = 50, before?: string) {
    let params = new HttpParams().set('limit', String(limit));
    if (before) params = params.set('before', before);
    return this.http.get<{ messages: MessageDto[] }>(`${this.base}/${encodeURIComponent(chatId)}`, { params, withCredentials: true });
  }

  sendMessage(chatId: string, content: string, type: string = 'text') {
    return this.http.post<{ message: MessageDto }>(`${this.base}`, { chatId, content, type }, { withCredentials: true });
  }

  markRead(chatId: string) {
    return this.http.post<{ updated: number }>(`${this.base}/${encodeURIComponent(chatId)}/read`, {}, { withCredentials: true });
  }

  addReaction(messageId: string, emoji: string) {
    return this.http.post<{ message: string }>(`${this.base}/${encodeURIComponent(messageId)}/reactions`, { emoji }, { withCredentials: true });
  }

  removeReaction(messageId: string) {
    return this.http.delete<{ message: string }>(`${this.base}/${encodeURIComponent(messageId)}/reactions`, { withCredentials: true });
  }

  uploadMedia(chatId: string, file: File, type: string = 'file') {
    const form = new FormData();
    form.append('file', file);
    form.append('chatId', chatId);
    form.append('type', type);
    return this.http.post<{ message: MessageDto }>(`${this.base}/media/upload`, form, { withCredentials: true });
  }

  storeMedia(chatId: string, mediaUrl: string, type: string = 'file') {
    return this.http.post<{ message: MessageDto }>(`${this.base}/media`, { chatId, mediaUrl, type }, { withCredentials: true });
  }

  markDelivered(messageId: string) {
    return this.http.post<{ updated: number }>(`${this.base}/${encodeURIComponent(messageId)}/delivered`, {}, { withCredentials: true });
  }

  markDeliveredBulk(chatId: string, messageIds?: string[]) {
    return this.http.post<{ updated: number }>(`${this.base}/delivered`, { chatId, messageIds }, { withCredentials: true });
  }
}
