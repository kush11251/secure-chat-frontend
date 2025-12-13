import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './shared/ui/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent],
  template: `
    <router-outlet />
    <sc-toast-host />
  `
})
export class AppComponent {
  title = 'secure-chat-frontend';
}
