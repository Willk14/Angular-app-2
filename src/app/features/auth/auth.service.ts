import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSignal = signal<string | null>(null);

  login(username: string, password: string): boolean {
    const isValid = username === 'admin' && password === '1234';

    if (isValid) {
      this.currentUserSignal.set(username);
    } else {
      this.currentUserSignal.set(null);
    }

    return isValid;
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  getCurrentUser(): string | null {
    return this.currentUserSignal();
  }
}
