import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ChatDto {
  _id: string;
  isGroup: boolean;
  groupName?: string;
  members: Array<{ _id: string; uid: string; name: string; status?: string }>;
  lastMessage?: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl + '/chats';

  listChats() { return this.http.get<{ chats: ChatDto[] }>(`${this.base}`); }

  getOrCreateDirect(userId: string) {
    return this.http.post<{ chat: ChatDto }>(`${this.base}/direct`, { userId });
  }

  createGroup(groupName: string, memberIds: string[]) {
    return this.http.post<{ chat: ChatDto }>(`${this.base}/group`, { groupName, memberIds }, { withCredentials: true });
  }

  updateGroup(chatId: string, payload: { groupName?: string }) {
    return this.http.patch<{ chat: ChatDto }>(`${this.base}/${encodeURIComponent(chatId)}`, payload, { withCredentials: true });
  }

  addMembers(chatId: string, memberIds: string[]) {
    return this.http.post<{ chat: ChatDto }>(`${this.base}/${encodeURIComponent(chatId)}/members`, { memberIds }, { withCredentials: true });
  }

  removeMember(chatId: string, memberId: string) {
    return this.http.delete<{ chat: ChatDto }>(`${this.base}/${encodeURIComponent(chatId)}/members/${encodeURIComponent(memberId)}`, { withCredentials: true });
  }

  pinChat(chatId: string) {
    return this.http.post<{ message: string }>(`${this.base}/${encodeURIComponent(chatId)}/pin`, {}, { withCredentials: true });
  }

  unpinChat(chatId: string) {
    return this.http.post<{ message: string }>(`${this.base}/${encodeURIComponent(chatId)}/unpin`, {}, { withCredentials: true });
  }
}
