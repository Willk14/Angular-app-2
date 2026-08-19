import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { finalize, tap } from 'rxjs';

import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule, SkeletonModule],
  template: `
    <section class="profile-page">
      @if (loading()) {
        <div class="profile-card">
          <p-skeleton width="60%" height="2rem"></p-skeleton>
          <p-skeleton width="40%" height="1.5rem"></p-skeleton>
          <p-skeleton width="100%" height="4rem"></p-skeleton>
        </div>
      } @else if (errorMessage()) {
        <div class="profile-card">
          <p-message severity="error" [text]="errorMessage()"></p-message>
        </div>
      } @else if (user(); as currentUser) {
        <div class="profile-card">
          <h1>My Profile</h1>
          <div class="profile-grid">
            <div><strong>Name</strong><p>{{ currentUser.name }}</p></div>
            <div><strong>Email</strong><p>{{ currentUser.email || 'Not provided' }}</p></div>
            <div><strong>Role</strong><p>{{ currentUser.role }}</p></div>
          </div>
          <button pButton type="button" label="Logout" (click)="logout()"></button>
        </div>
      }
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.profile-page { display: flex; justify-content: center; }`,
    `.profile-card { width: min(100%, 560px); display: grid; gap: 1rem; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 12px; background: white; }`,
    `.profile-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }`
  ]
})
export class UserProfileComponent implements OnInit {
  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | undefined>(undefined);

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  ngOnInit() {
    const token = this.authService.getToken();

    if (!token) {
      this.loading.set(false);
      this.errorMessage.set('Please log in to view your profile.');
      return;
    }

    this.http.get<User>('http://localhost:3001/api/v1/auth/profile', {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).pipe(
      tap((profile) => {
        console.info('Profile loaded successfully.', profile);
        this.user.set(profile);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      error: () => {
        this.errorMessage.set('Unable to load your profile right now.');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
