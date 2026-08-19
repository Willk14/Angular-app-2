import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UsernameAvailabilityService } from './username-availability.service';

@Component({
  selector: 'app-username-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="registration-page">
      <article class="registration-card" aria-label="Registration form">
        <h2>Create your account</h2>
        <p class="subtitle">Join ShopSmart and start shopping smarter.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            <span>Username</span>
            <input
              formControlName="username"
              placeholder="Choose a username"
              autocomplete="username"
              [class.invalid]="form.get('username')?.touched && form.get('username')?.invalid"
            />
          </label>
          @if (form.get('username')?.touched && form.get('username')?.hasError('required')) {
            <p class="field-error">Username is required.</p>
          }
          @if (form.get('username')?.touched && form.get('username')?.hasError('minlength')) {
            <p class="field-error">Username must be at least 3 characters.</p>
          }

          @if (usernameStatus()) {
            <p class="status" [class.available]="usernameStatus() === 'available'" [class.taken]="usernameStatus() === 'taken'">
              {{ usernameStatus() === 'available' ? 'Username available' : 'Username already exists' }}
            </p>
          }

          <label>
            <span>Email Address</span>
            <input
              formControlName="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              [class.invalid]="form.get('email')?.touched && form.get('email')?.invalid"
            />
          </label>
          @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
            <p class="field-error">Email is required.</p>
          }
          @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
            <p class="field-error">Please enter a valid email address.</p>
          }

          <label>
            <span>Password</span>
            <input
              formControlName="password"
              type="password"
              placeholder="Enter a secure password"
              autocomplete="new-password"
              [class.invalid]="form.get('password')?.touched && form.get('password')?.invalid"
            />
          </label>
          @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
            <p class="field-error">Password is required.</p>
          }
          @if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
            <p class="field-error">Password must be at least 6 characters.</p>
          }

          <button type="submit" [disabled]="checkingUsername()">
            {{ checkingUsername() ? 'Checking username...' : 'Create account' }}
          </button>
        </form>
      </article>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.registration-page { min-height: calc(100vh - 4rem); display: grid; place-items: center; padding: 1.5rem; background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.28), transparent 28%), linear-gradient(135deg, #0b1324 0%, #0f172a 45%, #13203d 100%); }`,
    `.registration-card { width: min(100%, 450px); margin: 0 auto; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 18px; background: #ffffff; box-shadow: 0 24px 64px rgba(2, 8, 23, 0.35); }`,
    `h2 { margin: 0; font-size: 1.9rem; line-height: 1.1; color: #111827; }`,
    `.subtitle { margin: 0.5rem 0 1.3rem; color: #374151; font-size: 1rem; }`,
    `form { display: grid; gap: 1rem; }`,
    `label { display: grid; gap: 0.45rem; }`,
    `label > span { color: #111827; font-weight: 700; font-size: 0.95rem; }`,
    `input { width: 100%; padding: 0.88rem 0.92rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #111827; caret-color: #111827; font-size: 16px; font-weight: 500; line-height: 1.4; transition: border-color 0.2s ease, box-shadow 0.2s ease; }`,
    `input.invalid { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12); }`,
    `input::placeholder { color: #6b7280; opacity: 1; }`,
    `input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16), 0 4px 12px rgba(37, 99, 235, 0.12); }`,
    `input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-text-fill-color: #111827; -webkit-box-shadow: 0 0 0px 1000px #ffffff inset; transition: background-color 5000s ease-in-out 0s; }`,
    `button { padding: 0.85rem 1rem; border: 0; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 12px 26px rgba(37, 99, 235, 0.26); transition: transform 0.2s ease, box-shadow 0.2s ease; }`,
    `button:hover:not([disabled]) { transform: translateY(-1px); box-shadow: 0 16px 30px rgba(37, 99, 235, 0.3); }`,
    `button[disabled] { opacity: 0.7; cursor: not-allowed; }`,
    `.status { margin: -0.2rem 0 0.1rem; font-weight: 700; font-size: 0.9rem; }`,
    `.status.available { color: #15803d; }`,
    `.status.taken { color: #dc2626; }`,
    `.field-error { margin: -0.45rem 0 0.1rem; color: #dc2626; font-size: 0.86rem; font-weight: 600; }`,
    `@media (max-width: 560px) { .registration-card { padding: 1.35rem; border-radius: 14px; } h2 { font-size: 1.6rem; } }`
  ]
})
export class UsernameAvailabilityComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly form: FormGroup;
  readonly usernameStatus = signal<'available' | 'taken' | null>(null);
  readonly checkingUsername = signal(false);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly usernameService: UsernameAvailabilityService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.form.get('username')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value: string) => {
        const normalized = (value ?? '').trim();
        this.usernameStatus.set(null);
        if (!normalized) {
          this.checkingUsername.set(false);
          return [] as never[];
        }

        this.checkingUsername.set(true);
        return this.usernameService.checkUsername(normalized).pipe(
          finalize(() => this.checkingUsername.set(false))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (isAvailable: boolean) => {
        this.usernameStatus.set(isAvailable ? 'available' : 'taken');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password } = this.form.getRawValue();
    this.authService.registerCredential(email ?? '', password ?? '', username ?? 'User');

    this.router.navigate(['/login']);
  }
}
