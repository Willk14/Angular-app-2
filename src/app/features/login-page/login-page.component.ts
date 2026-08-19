import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="login-page">
      <article class="login-card" aria-label="Login form">
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to continue shopping</p>

        @if (isLoggedIn()) {
          <p class="success">Welcome back, John!</p>
        } @else {
          <form (ngSubmit)="login()" #loginForm="ngForm">
            <label>
                <span>Email or username</span>
              <input
                name="email"
                  type="text"
                [(ngModel)]="email"
                  placeholder="you@example.com or username"
                autocomplete="email"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                name="password"
                type="password"
                [(ngModel)]="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
              />
            </label>

            <button type="submit">Login</button>
            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }
          </form>
        }
      </article>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.login-page { min-height: calc(100vh - 4rem); display: grid; place-items: center; padding: 1.5rem; background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.28), transparent 28%), linear-gradient(135deg, #0b1324 0%, #0f172a 45%, #13203d 100%); }`,
    `.login-card { width: min(100%, 450px); padding: 2.25rem; border-radius: 18px; border: 1px solid #e5e7eb; background: #ffffff; box-shadow: 0 24px 64px rgba(2, 8, 23, 0.35); animation: fadeIn 0.5s ease; }`,
    `h2 { margin: 0; font-size: 2rem; color: #111827; line-height: 1.1; }`,
    `.subtitle { margin: 0.5rem 0 1.25rem; color: #374151; font-size: 1rem; }`,
    `form { display: grid; gap: 1rem; }`,
    `label { display: grid; gap: 0.45rem; }`,
    `label > span { color: #111827; font-weight: 700; font-size: 0.95rem; }`,
    `input { width: 100%; padding: 0.88rem 0.92rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #111827; caret-color: #111827; font-size: 16px; font-weight: 500; line-height: 1.4; transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease; }`,
    `input::placeholder { color: #6b7280; opacity: 1; }`,
    `input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16), 0 4px 12px rgba(37, 99, 235, 0.12); background: #ffffff; }`,
    `input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-text-fill-color: #111827; -webkit-box-shadow: 0 0 0px 1000px #ffffff inset; transition: background-color 5000s ease-in-out 0s; }`,
    `button { padding: 0.85rem 1rem; border: 0; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 12px 26px rgba(37, 99, 235, 0.26); transition: transform 0.2s ease, box-shadow 0.2s ease; }`,
    `button:hover { transform: translateY(-1px); box-shadow: 0 16px 30px rgba(37, 99, 235, 0.3); }`,
    `.success { margin: 0.25rem 0 0; color: #15803d; font-weight: 700; }`,
    `.error { margin: 0.1rem 0 0; color: #dc2626; font-weight: 700; }`,
    `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`,
    `@media (max-width: 560px) { .login-card { padding: 1.4rem; border-radius: 14px; } h2 { font-size: 1.65rem; } }`
  ]
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoggedIn = signal(false);
  readonly errorMessage = signal('');

  email = '';
  password = '';

  login(): void {
    const authenticatedUser = this.authService.loginWithRegisteredCredential(this.email, this.password);

    if (authenticatedUser) {
      this.isLoggedIn.set(true);
      this.errorMessage.set('');
      this.router.navigate(['/dashboard']);
    } else {
      this.isLoggedIn.set(false);
      this.errorMessage.set('Invalid email or password.');
    }
  }
}
