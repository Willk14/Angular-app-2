import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  host: {
    '(document:click)': 'handleDocumentClick($event)'
  },
  template: `
    <header class="navbar-shell">
      <a class="brand" routerLink="/">
        <span class="brand-mark">S</span>
        <span>ShopSmart</span>
      </a>

      @if (!authService.isAuthenticated()) {
        <nav class="auth-shortcuts">
          <a routerLink="/login" routerLinkActive="active">Login</a>
          <a routerLink="/register" routerLinkActive="active">Register</a>
        </nav>
      }

      <button class="menu-toggle" type="button" (click)="toggleNav()" aria-label="Toggle navigation">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="nav-links" [class.open]="isNavOpen()">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a routerLink="/products" routerLinkActive="active">Products</a>
        @if (!isLandingPage()) {
          <a routerLink="/cart" routerLinkActive="active" class="cart-link">
            <span>Cart</span>
            <span class="badge">{{ cartService.itemCount() }}</span>
          </a>
        }
        <a href="#about">About</a>
        <a routerLink="/contact" routerLinkActive="active">Contact</a>
      </nav>

      @if (authService.isAuthenticated()) {
        <div class="nav-actions">
          <button type="button" class="avatar-button" (click)="toggleUserMenu()" [attr.aria-expanded]="isUserMenuOpen()">
            <span class="avatar">{{ avatarInitials() }}</span>
            <span class="avatar-label">{{ authService.currentUser()?.name ?? 'Account' }}</span>
          </button>

          @if (isUserMenuOpen()) {
            <div class="account-menu">
              <a routerLink="/dashboard">Dashboard</a>
              <a routerLink="/profile">Profile</a>
              <button type="button" (click)="logout()">Logout</button>
            </div>
          }
        </div>
      }
    </header>
  `,
  styles: [
    `:host { display: block; position: sticky; top: 0; z-index: 120; }`,
    `.navbar-shell { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.95rem 1.25rem; background: rgba(11, 11, 15, 0.76) !important; backdrop-filter: blur(20px); border-bottom: 1px solid rgba(42, 45, 52, 0.9) !important; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28) !important; }`,
    `.brand { display: inline-flex; align-items: center; gap: 0.75rem; font-weight: 800; letter-spacing: 0.01em; color: #f8fafc; text-decoration: none; }`,
    `.brand-mark { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: 999px; background: linear-gradient(135deg, #2563eb, #60a5fa) !important; color: white !important; box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25); }`,
    `.auth-shortcuts { display: inline-flex; align-items: center; gap: 0.7rem; margin-left: 0.6rem; }`,
    `.auth-shortcuts a { color: #d1d5db; text-decoration: none; font-weight: 600; padding: 0.45rem 0.85rem; border-radius: 999px; border: 1px solid rgba(42, 45, 52, 0.9); background: rgba(22, 24, 29, 0.82); transition: all 0.2s ease; }`,
    `.auth-shortcuts a:hover, .auth-shortcuts a.active { color: #f8fafc; border-color: rgba(59, 130, 246, 0.8); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14); }`,
    `.menu-toggle { display: none; border: 0; background: transparent !important; cursor: pointer; padding: 0.35rem; box-shadow: none !important; }`,
    `.menu-toggle span { display: block; width: 1.45rem; height: 2px; margin: 0.24rem 0; background: #f8fafc !important; border-radius: 999px; box-shadow: none !important; }`,
    `.nav-links { display: flex; align-items: center; gap: 1rem; }`,
    `.nav-links a { position: relative; color: #d1d5db; text-decoration: none; font-weight: 600; padding: 0.25rem 0; transition: color 0.2s ease; }`,
    `.nav-links a::after { content: ''; position: absolute; left: 0; bottom: -0.25rem; width: 100%; height: 2px; background: linear-gradient(135deg, #2563eb, #60a5fa); transform: scaleX(0); transform-origin: center; transition: transform 0.2s ease; }`,
    `.nav-links a:hover, .nav-links a.active { color: #f8fafc; }`,
    `.nav-links a:hover::after, .nav-links a.active::after { transform: scaleX(1); }`,
    `.cart-link { display: inline-flex; align-items: center; gap: 0.45rem; }`,
    `.badge { display: inline-grid; place-items: center; min-width: 1.35rem; height: 1.35rem; padding: 0 0.4rem; border-radius: 999px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; font-size: 0.78rem; }`,
    `.nav-actions { position: relative; display: inline-flex; align-items: center; }`,
    `.avatar-button { display: inline-flex; align-items: center; gap: 0.65rem; padding: 0.45rem 0.8rem; border-radius: 999px; background: rgba(22, 24, 29, 0.92) !important; border: 1px solid rgba(42, 45, 52, 0.9) !important; color: #f8fafc !important; box-shadow: none !important; }`,
    `.avatar { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px; background: linear-gradient(135deg, #2563eb, #60a5fa) !important; color: white !important; font-size: 0.85rem; font-weight: 700; }`,
    `.avatar-label { font-weight: 600; }`,
    `.account-menu { position: absolute; top: calc(100% + 0.7rem); right: 0; min-width: 180px; display: grid; gap: 0.25rem; padding: 0.5rem; border: 1px solid rgba(42, 45, 52, 0.95) !important; border-radius: 16px; background: rgba(11, 11, 15, 0.98) !important; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.38) !important; }`,
    `.account-menu a, .account-menu button { display: block; width: 100%; text-align: left; padding: 0.7rem 0.85rem; border-radius: 12px; border: 0; background: transparent !important; color: #f8fafc !important; text-decoration: none; box-shadow: none !important; }`,
    `.account-menu a:hover, .account-menu button:hover { background: rgba(59, 130, 246, 0.12); transform: none; }`,
    `@media (max-width: 900px) { .menu-toggle { display: inline-block; margin-left: auto; } .auth-shortcuts { margin-left: auto; margin-right: 0.5rem; } .auth-shortcuts a { padding: 0.35rem 0.7rem; font-size: 0.9rem; } .nav-links { display: none; position: absolute; left: 1rem; right: 1rem; top: calc(100% + 0.75rem); flex-direction: column; align-items: flex-start; padding: 1rem; border: 1px solid rgba(42, 45, 52, 0.95); border-radius: 18px; background: rgba(11, 11, 15, 0.98); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); } .nav-links.open { display: flex; } .navbar-shell { position: relative; } .avatar-label { display: none; } }`,
    `@media (max-width: 560px) { .auth-shortcuts a { padding: 0.3rem 0.55rem; font-size: 0.82rem; } }`
  ]
})
export class NavbarComponent {
  readonly isNavOpen = signal(false);
  readonly isUserMenuOpen = signal(false);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );
  readonly isLandingPage = computed(() => this.currentPath() === '/');

  avatarInitials(): string {
    const name = this.authService.currentUser()?.name?.trim();
    if (!name) {
      return 'G';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
  }

  toggleNav() {
    this.isNavOpen.update((value) => !value);
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update((value) => !value);
  }

  handleDocumentClick(event: Event) {
    if (!this.isNavOpen() && !this.isUserMenuOpen()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (this.hostElement.nativeElement.contains(target)) {
      return;
    }

    this.isNavOpen.set(false);
    this.isUserMenuOpen.set(false);
  }

  logout() {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
      this.isUserMenuOpen.set(false);
      this.router.navigate(['/']);
    }
  }
}


