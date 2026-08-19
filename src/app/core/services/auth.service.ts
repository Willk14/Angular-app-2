import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models';

interface RegisteredCredential {
  email: string;
  password: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenStorageKey = 'auth_token';
  private readonly credentialsStorageKey = 'registered_credentials';

  currentUser = signal<User | null>(null);
  token = signal<string | null>(this.getStoredToken());

  isAuthenticated = computed(() => !!this.currentUser() || !!this.token());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  setCurrentUser(user: User, accessToken?: string) {
    this.currentUser.set(user);

    if (accessToken) {
      this.setToken(accessToken);
    }
  }

  setToken(token: string | null) {
    this.token.set(token);

    if (token) {
      localStorage.setItem(this.tokenStorageKey, token);
    } else {
      localStorage.removeItem(this.tokenStorageKey);
    }
  }

  logout() {
    this.currentUser.set(null);
    this.setToken(null);
  }

  getToken() {
    return this.token() ?? this.currentUser()?.token ?? null;
  }

  registerCredential(email: string, password: string, name: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const credentials = this.getStoredCredentials();

    const existing = credentials.find((entry) => entry.email === normalizedEmail);
    if (existing) {
      existing.password = password;
      existing.name = name;
    } else {
      credentials.push({ email: normalizedEmail, password, name });
    }

    this.setStoredCredentials(credentials);
  }

  loginWithRegisteredCredential(email: string, password: string): User | null {
    const normalizedIdentifier = email.trim().toLowerCase();
    const credentials = this.getStoredCredentials();
    const matched = credentials.find(
      (entry) =>
        (entry.email === normalizedIdentifier || entry.name.trim().toLowerCase() === normalizedIdentifier) &&
        entry.password === password
    );

    if (matched) {
      const user: User = {
        id: Date.now(),
        name: matched.name,
        email: matched.email,
        role: 'user'
      };

      this.setCurrentUser(user, `local-token-${user.id}`);
      return user;
    }

    // Keep the previous demo credentials so existing behavior still works.
    if ((normalizedIdentifier === 'john@example.com' || normalizedIdentifier === 'john@gmail.com') && password === '123456') {
      const user: User = { id: 1, name: 'John', email: normalizedIdentifier, role: 'user' };
      this.setCurrentUser(user, 'local-token-john');
      return user;
    }

    return null;
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.tokenStorageKey);
  }

  private getStoredCredentials(): RegisteredCredential[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.credentialsStorageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as RegisteredCredential[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setStoredCredentials(credentials: RegisteredCredential[]) {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.credentialsStorageKey, JSON.stringify(credentials));
  }
}
