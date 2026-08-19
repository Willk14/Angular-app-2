import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSignal = signal<Notification[]>([]);
  private nextId = 1;

  notifications = this.notificationsSignal;

  showSuccess(message: string): void {
    this.pushNotification('success', message);
  }

  showError(message: string): void {
    this.pushNotification('error', message);
  }

  showWarning(message: string): void {
    this.pushNotification('warning', message);
  }

  private pushNotification(type: Notification['type'], message: string): void {
    const notification: Notification = { id: this.nextId++, type, message };
    this.notificationsSignal.update((items) => [...items, notification]);

    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 3000);
  }

  private removeNotification(id: number): void {
    this.notificationsSignal.update((items) => items.filter((item) => item.id !== id));
  }
}
