import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (notificationService.notifications().length) {
      <div class="notification-stack">
        @for (item of notificationService.notifications(); track item.id) {
          <div class="notification" [class]="item.type">
            <span class="icon">
              @switch (item.type) {
                @case ('success') { ✅ }
                @case ('warning') { ⚠ }
                @default { ❌ }
              }
            </span>
            <span>{{ item.message }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `:host { display: block; }`,
    `.notification-stack { position: fixed; top: 1rem; right: 1rem; display: grid; gap: 0.75rem; z-index: 1000; max-width: 320px; }`,
    `.notification { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.9rem 1rem; border-radius: 10px; color: white; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16); }`,
    `.notification.success { background: #15803d; }`,
    `.notification.error { background: #b91c1c; }`,
    `.notification.warning { background: #d97706; }`,
    `.icon { font-size: 1.05rem; }`
  ]
})
export class NotificationComponent {
  constructor(readonly notificationService: NotificationService) {}
}
