import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="settings-shell">
      <h1>Theme Settings</h1>
      <p>Switch between light and dark themes using Angular signals.</p>

      <div class="controls">
        <button type="button" (click)="setTheme('light')">Light Theme</button>
        <button type="button" (click)="setTheme('dark')">Dark Theme</button>
      </div>

      <p class="current-theme">Current theme: {{ theme() }}</p>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.settings-shell { max-width: 720px; margin: 0 auto; padding: 1.5rem; border-radius: 16px; background: #fff; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }`,
    `.controls { display: flex; gap: 0.75rem; margin: 1rem 0; }`,
    `button { padding: 0.7rem 1rem; border: 0; border-radius: 999px; background: #111827; color: #fff; cursor: pointer; }`,
    `.current-theme { font-weight: 700; text-transform: capitalize; }`
  ]
})
export class SettingsPageComponent {
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      if (typeof document === 'undefined') {
        return;
      }

      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(currentTheme === 'dark' ? 'theme-dark' : 'theme-light');
    });
  }

  setTheme(theme: 'light' | 'dark') {
    this.theme.set(theme);
  }
}
