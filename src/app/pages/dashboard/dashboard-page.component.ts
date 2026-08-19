import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ProductsApiService } from '../../core/services/api/products-api.service';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="dashboard-shell">
      <div class="hero-card">
        <p class="eyebrow">Welcome back</p>
        <h1>{{ authService.currentUser()?.name ?? 'Guest' }}</h1>
        <p>Review your activity and jump straight to the store sections.</p>
      </div>

      <div class="stats-grid">
        <article class="stat-card">
          <h3>Total Products</h3>
          <p>{{ dashboardStats().totalProducts }}</p>
        </article>
        <article class="stat-card">
          <h3>Total Orders</h3>
          <p>{{ dashboardStats().totalOrders }}</p>
        </article>
        <article class="stat-card">
          <h3>Cart Items</h3>
          <p>{{ dashboardStats().cartItems }}</p>
        </article>
        <article class="stat-card">
          <h3>Revenue</h3>
          <p>{{ dashboardStats().revenue | currency }}</p>
        </article>
      </div>

      <div class="actions">
        <button type="button" routerLink="/products">Products</button>
        <button type="button" routerLink="/cart">Cart</button>
        <button type="button" routerLink="/profile">Profile</button>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.dashboard-shell { max-width: 980px; margin: 0 auto; display: grid; gap: 1rem; color: #f8fafc; }`,
    `.hero-card, .stat-card {
      padding: 1.25rem;
      border-radius: 16px;
      border: 1px solid rgba(59, 130, 246, 0.25);
      background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 45%),
        linear-gradient(165deg, rgba(11, 11, 15, 0.96), rgba(16, 18, 24, 0.98));
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.34);
    }`,
    `.hero-card h1 { margin: 0 0 0.35rem; font-size: clamp(1.6rem, 2.8vw, 2.1rem); color: #f8fafc; }`,
    `.hero-card p { margin: 0; color: rgba(203, 213, 225, 0.95); font-size: 1rem; }`,
    `.stats-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }`,
    `.stat-card h3 { margin: 0 0 0.45rem; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; }`,
    `.stat-card p { margin: 0; font-size: 1.35rem; font-weight: 700; color: #f8fafc; }`,
    `.eyebrow { margin: 0 0 0.25rem; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; }`,
    `.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }`,
    `button { padding: 0.7rem 1rem; border: 0; border-radius: 999px; background: #2563eb; color: #ffffff; font-weight: 700; cursor: pointer; box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25); }`,
    `button:hover { filter: brightness(1.05); }`
  ]
})
export class DashboardPageComponent {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  private readonly productsApiService = inject(ProductsApiService);
  private readonly ordersService = inject(OrdersService);

  readonly dashboardStats = toSignal(
    combineLatest([
      this.productsApiService.getProducts().pipe(catchError(() => of([]))),
      toObservable(this.cartService.cartItems),
      toObservable(this.ordersService.orders)
    ]).pipe(
      map(([products, cartItems, orders]) => ({
        totalProducts: products.length,
        totalOrders: orders.length,
        cartItems: cartItems.reduce((count, item) => count + item.quantity, 0),
        revenue: orders.reduce((sum, order) => sum + order.total, 0)
      }))
    ),
    {
      initialValue: {
        totalProducts: 0,
        totalOrders: 0,
        cartItems: 0,
        revenue: 0
      }
    }
  );

}
