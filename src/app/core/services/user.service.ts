import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserDto { id?: string; _id?: string; uid: string; name: string; email?: string; status?: string; lastSeen?: string; avatarUrl?: string }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl + '/users';

  me() {
    return this.http.get<{ user: any }>(`${this.base}/me`, { withCredentials: true });
  }

  updateProfile(payload: { name?: string; notificationsToken?: string }) {
    return this.http.patch<{ user: any }>(`${this.base}/me`, payload, { withCredentials: true });
  }

  updateNotificationsToken(token: string) {
    return this.http.post<{ message: string }>(`${this.base}/notifications-token`, { token }, { withCredentials: true });
  }

  searchByUID(uid: string) {
    return this.http.get<{ user: UserDto }>(`${this.base}/search`, { params: { uid }, withCredentials: true });
  }

  addContactByUID(uid: string) {
    return this.http.post<{ contacts: string[] }>(`${this.base}/contacts`, { uid }, { withCredentials: true });
  }

  removeContactByUID(uid: string) {
    return this.http.delete<{ contacts: any[] }>(`${this.base}/contacts/${encodeURIComponent(uid)}`, { withCredentials: true });
  }

  listContacts() {
    return this.http.get<{ contacts: UserDto[] }>(`${this.base}/contacts`, { withCredentials: true });
  }
}
