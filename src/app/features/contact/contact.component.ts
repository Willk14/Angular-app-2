import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

interface ContactFormModel {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact-shell" aria-labelledby="contact-heading">
      <article class="contact-card">
        <header class="contact-header">
          <p class="eyebrow">Contact ShopSmart</p>
          <h1 id="contact-heading">Contact Us</h1>
          <p class="subtitle">Have a question, request, or feedback? Send us a message and our team will get back to you.</p>
        </header>

        @if (successMessage()) {
          <div class="success-banner" role="status" aria-live="polite">
            {{ successMessage() }}
          </div>
        }

        <form #contactForm="ngForm" (ngSubmit)="submit(contactForm)" novalidate class="contact-form">
          <label class="field">
            <span>Full Name</span>
            <input
              type="text"
              name="fullName"
              [(ngModel)]="formModel.fullName"
              #fullName="ngModel"
              required
              placeholder="Enter your full name"
              autocomplete="name"
            />
            @if (fullName.touched && fullName.invalid) {
              <small class="field-error">Full Name is required.</small>
            }
          </label>

          <label class="field">
            <span>Email Address</span>
            <input
              type="email"
              name="email"
              [(ngModel)]="formModel.email"
              #email="ngModel"
              required
              email
              placeholder="you@example.com"
              autocomplete="email"
            />
            @if (email.touched && email.hasError('required')) {
              <small class="field-error">Email Address is required.</small>
            }
            @if (email.touched && !email.hasError('required') && email.hasError('email')) {
              <small class="field-error">Please enter a valid email address.</small>
            }
          </label>

          <label class="field">
            <span>Subject</span>
            <input
              type="text"
              name="subject"
              [(ngModel)]="formModel.subject"
              #subject="ngModel"
              required
              placeholder="How can we help?"
            />
            @if (subject.touched && subject.invalid) {
              <small class="field-error">Subject is required.</small>
            }
          </label>

          <label class="field field-message">
            <span>Message</span>
            <textarea
              name="message"
              [(ngModel)]="formModel.message"
              #message="ngModel"
              required
              rows="6"
              placeholder="Write your message"
            ></textarea>
            @if (message.touched && message.invalid) {
              <small class="field-error">Message is required.</small>
            }
          </label>

          <div class="actions">
            <button type="submit" [disabled]="contactForm.invalid">Send Message</button>
          </div>
        </form>
      </article>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.contact-shell { display: grid; }`,
    `.contact-card {
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 20px;
      padding: 1.5rem;
      background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 45%),
        linear-gradient(165deg, rgba(11, 11, 15, 0.96), rgba(16, 18, 24, 0.98));
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.38);
    }`,
    `.contact-header { margin-bottom: 1rem; }`,
    `.eyebrow { margin: 0 0 0.35rem; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.78rem; font-weight: 700; }`,
    `h1 { margin: 0; color: #f8fafc; font-size: clamp(1.8rem, 3.5vw, 2.2rem); }`,
    `.subtitle { margin: 0.45rem 0 0; color: rgba(203, 213, 225, 0.92); max-width: 70ch; }`,
    `.success-banner {
      margin-bottom: 1rem;
      padding: 0.75rem 0.9rem;
      border-radius: 12px;
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #e0f2fe;
      background: linear-gradient(140deg, rgba(2, 132, 199, 0.25), rgba(14, 116, 144, 0.18));
    }`,
    `.contact-form { display: grid; gap: 0.95rem; }`,
    `.field { display: grid; gap: 0.45rem; }`,
    `.field > span { color: #e2e8f0; font-weight: 600; }`,
    `input, textarea {
      width: 100%;
      border: 1px solid rgba(71, 85, 105, 0.8);
      border-radius: 12px;
      padding: 0.82rem 0.95rem;
      background: rgba(9, 11, 16, 0.95);
      color: #f8fafc;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }`,
    `textarea { resize: vertical; min-height: 130px; }`,
    `input::placeholder, textarea::placeholder { color: rgba(148, 163, 184, 0.95); }`,
    `input:focus, textarea:focus {
      outline: none;
      border-color: rgba(59, 130, 246, 0.85);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
    }`,
    `.field-error { color: #fca5a5; font-size: 0.85rem; }`,
    `.actions { margin-top: 0.25rem; }`,
    `button {
      border: 1px solid rgba(96, 165, 250, 0.62);
      border-radius: 999px;
      padding: 0.62rem 1.2rem;
      background: linear-gradient(140deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.88));
      color: #f8fafc;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
    }`,
    `button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(37, 99, 235, 0.32); filter: brightness(1.04); }`,
    `button:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }`,
    `@media (max-width: 640px) { .contact-card { padding: 1.2rem; border-radius: 16px; } }`
  ]
})
export class ContactComponent {
  readonly successMessage = signal<string | null>(null);

  readonly formModel: ContactFormModel = {
    fullName: '',
    email: '',
    subject: '',
    message: ''
  };

  submit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.successMessage.set('Message sent successfully. We will contact you shortly.');

    form.resetForm({
      fullName: '',
      email: '',
      subject: '',
      message: ''
    });
  }
}
