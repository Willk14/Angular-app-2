import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface UserProfile {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-user-profile-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="profile-card">
      <div class="profile-header">
        <p class="eyebrow">Profile</p>
        <h2>Personal Details</h2>
        <p class="subtitle">Update your basic information and review it instantly below.</p>
      </div>

      <div class="fields">
        <label>
          <span>Name</span>
          <input [value]="user().name" placeholder="Enter your full name" (input)="updateField('name', $any($event.target).value)" />
        </label>

        <label>
          <span>Email</span>
          <input [value]="user().email" placeholder="Enter your email address" (input)="updateField('email', $any($event.target).value)" />
        </label>

        <label>
          <span>Age</span>
          <input type="number" [value]="user().age" placeholder="Enter your age" (input)="updateField('age', +$any($event.target).value)" />
        </label>
      </div>

      <div class="preview">
        <h3>Preview</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <strong>Name</strong>
            <p>{{ user().name || 'Not provided yet' }}</p>
          </div>
          <div class="preview-item">
            <strong>Email</strong>
            <p>{{ user().email || 'Not provided yet' }}</p>
          </div>
          <div class="preview-item">
            <strong>Age</strong>
            <p>{{ user().age || 0 }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.profile-card { max-width: 640px; margin: 0 auto; padding: 1.75rem; border: 1px solid #dbe3ef; border-radius: 18px; background: #ffffff; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); color: #111827; }`,
    `.profile-header { margin-bottom: 1.25rem; }`,
    `.eyebrow { margin: 0 0 0.35rem; color: #2563eb; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 800; font-size: 0.8rem; }`,
    `.profile-header h2 { margin: 0; font-size: 1.9rem; color: #0f172a; }`,
    `.subtitle { margin: 0.45rem 0 0; color: #475569; font-size: 1rem; }`,
    `.fields { display: grid; gap: 0.95rem; margin-bottom: 1.25rem; }`,
    `label { display: grid; gap: 0.45rem; }`,
    `label span { color: #111827; font-weight: 700; font-size: 0.95rem; }`,
    `input { padding: 0.9rem 1rem; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff; color: #111827; caret-color: #111827; font-size: 16px; font-weight: 500; }`,
    `input::placeholder { color: #6b7280; opacity: 1; }`,
    `input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16), 0 4px 12px rgba(37, 99, 235, 0.12); }`,
    `.preview { padding-top: 1rem; border-top: 1px solid #e2e8f0; }`,
    `.preview h3 { margin: 0 0 0.9rem; color: #0f172a; font-size: 1.2rem; }`,
    `.preview-grid { display: grid; gap: 0.85rem; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }`,
    `.preview-item { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fbff; }`,
    `.preview-item strong { display: block; margin-bottom: 0.35rem; color: #334155; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.06em; }`,
    `.preview-item p { margin: 0; color: #111827; font-size: 1rem; font-weight: 600; }`,
    `@media (max-width: 560px) { .profile-card { padding: 1.25rem; } .profile-header h2 { font-size: 1.55rem; } }`
  ]
})
export class UserProfileEditorComponent {
  readonly user = signal<UserProfile>({
    name: '',
    email: '',
    age: 0
  });

  updateField<K extends keyof UserProfile>(field: K, value: UserProfile[K]): void {
    this.user.update((current) => ({
      ...current,
      [field]: value
    }));
  }
}
