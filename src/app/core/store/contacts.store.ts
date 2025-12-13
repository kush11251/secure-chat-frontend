import { Injectable, inject, signal } from '@angular/core';
import { UserDto, UserService } from '../services/user.service';

@Injectable({ providedIn: 'root' })
export class ContactsStore {
  private readonly api = inject(UserService);

  contacts = signal<UserDto[]>([]);
  loading = signal(false);

  load() {
    this.loading.set(true);
    this.api.listContacts().subscribe({
      next: (res) => {
        this.contacts.set(res.contacts || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  upsert(contact: UserDto) {
    const uid = contact.uid;
    this.contacts.update(list => {
      const idx = list.findIndex(c => c.uid === uid);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = { ...copy[idx], ...contact };
        return copy;
      }
      return [...list, contact];
    });
  }

  removeByUid(uid: string) {
    this.contacts.update(list => list.filter(c => c.uid !== uid));
  }

  updatePresenceById(id: string, status: 'online' | 'offline') {
    this.contacts.update(list => list.map(c => {
      const cid = (c as any).id || (c as any)._id;
      return String(cid) === String(id) ? { ...c, status } : c;
    }));
  }
}
