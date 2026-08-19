import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AuthService } from './auth.service';
import { NotificationService } from '../notifications/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-card">
      <h2>Welcome Admin</h2>
      <button type="button" (click)="logout()">Logout</button>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.dashboard-card { max-width: 360px; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; background: white; display: grid; gap: 1rem; }`,
    `button { padding: 0.7rem 1rem; border: none; border-radius: 6px; background: #111827; color: white; cursor: pointer; }`
  ]
})
export class DashboardComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {}

  logout() {
    this.authService.logout();
    this.notificationService.showWarning('Product deleted.');
  }
}
