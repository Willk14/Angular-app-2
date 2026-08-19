import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from './auth.service';
import { NotificationService } from '../notifications/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-card">
      <h2>Login</h2>
      <form (ngSubmit)="submit()">
        <label>
          <span>Username</span>
          <input type="text" [(ngModel)]="username" name="username" />
        </label>

        <label>
          <span>Password</span>
          <input type="password" [(ngModel)]="password" name="password" />
        </label>

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <button type="submit">Login</button>
      </form>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.auth-card { max-width: 360px; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; background: white; display: grid; gap: 1rem; }`,
    `label { display: grid; gap: 0.35rem; }`,
    `input { padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; }`,
    `button { padding: 0.7rem 1rem; border: none; border-radius: 6px; background: #111827; color: white; cursor: pointer; }`,
    `.error { color: #b91c1c; margin: 0; }`
  ]
})
export class LoginComponent {
  username = '';
  password = '';
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {}

  submit() {
    const success = this.authService.login(this.username, this.password);

    if (success) {
      this.errorMessage.set(null);
      this.notificationService.showSuccess('User created successfully.');
    } else {
      this.errorMessage.set('Invalid username or password.');
      this.notificationService.showError('Invalid username or password.');
    }
  }
}
