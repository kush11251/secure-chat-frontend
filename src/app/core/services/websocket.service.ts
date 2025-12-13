import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket?: Socket;
  connected = signal(false);

  private backendOrigin(): string {
    try {
      // If apiBaseUrl is a full URL, use its origin; otherwise fall back to current origin.
      const url = new URL(environment.apiBaseUrl, window.location.origin);
      return url.origin; // socket.io defaults to '/socket.io' path
    } catch {
      return window.location.origin;
    }
  }

  connect(): Socket {
    if (!this.socket) {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
      this.socket = io(this.backendOrigin(), {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined
      });
      this.socket.on('connect', () => this.connected.set(true));
      this.socket.on('disconnect', () => this.connected.set(false));
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      this.connected.set(false);
    }
  }

  on<T = any>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      const s = this.connect();
      const handler = (data: T) => observer.next(data);
      s.on(event, handler);
      return () => s.off(event, handler);
    });
  }

  emit(event: string, payload?: any): void {
    const s = this.connect();
    s.emit(event, payload);
  }

  joinChat(chatId: string) { this.emit('join:chat', chatId); }
  leaveChat(chatId: string) { this.emit('leave:chat', chatId); }
}
