import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/ui/modal.component';
import { UserService, UserDto } from '../../core/services/user.service';
import { ContactsStore } from '../../core/store/contacts.store';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'sc-add-contact-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
  <sc-modal [open]="open" title="Add Contact" (closed)="close()">
    <form [formGroup]="form" class="space-y-3" (ngSubmit)="onSubmit()">
      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">User UID</label>
        <input type="text" formControlName="uid" class="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. JD1234" />
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800" (click)="onSearch()">Search</button>
        <button type="submit" class="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700 disabled:opacity-60" [disabled]="!found()">Add</button>
      </div>
      <div *ngIf="searched() && !found()" class="text-xs text-neutral-500">No user found for this UID.</div>
      <div *ngIf="found()" class="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-sm">
        {{ found()?.name }} ({{ found()?.uid }})
      </div>
    </form>
  </sc-modal>
  `
})
export class AddContactModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserService);
  private readonly contacts = inject(ContactsStore);
  private readonly toast = inject(ToastService);

  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  form = this.fb.nonNullable.group({ uid: ['', [Validators.required]] });
  searched = signal(false);
  found = signal<UserDto | null>(null);

  close() { this.closed.emit(); this.form.reset(); this.searched.set(false); this.found.set(null); }

  onSearch() {
    const uid = this.form.controls.uid.value.trim();
    if (!uid) return;
    this.api.searchByUID(uid).subscribe({
      next: (res) => { this.found.set(res.user); this.searched.set(true); },
      error: () => { this.found.set(null); this.searched.set(true); }
    });
  }

  onSubmit() {
    const user = this.found();
    if (!user) return;
    this.api.addContactByUID(user.uid).subscribe({
      next: () => { this.toast.success('Contact added'); this.contacts.load(); this.close(); },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to add contact')
    });
  }
}
