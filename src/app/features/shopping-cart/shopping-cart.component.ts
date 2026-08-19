import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concatMap, finalize, map, Observable, of, tap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CheckoutContext, CheckoutService, CreatedOrder } from '../../core/services/checkout.service';
import type { Product } from '../../core/models';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="cart-card">
      <h2>Shopping Cart</h2>

      <div class="summary">
        <h3>Cart</h3>
        @if (currentStep()) {
          <p class="checkout-step"><strong>Checkout Step:</strong> {{ currentStep() }}</p>
        }
        @if (checkoutError()) {
          <p class="checkout-error" role="alert">{{ checkoutError() }}</p>
        }
        @if (checkoutSuccess()) {
          <p class="checkout-success" role="status">{{ checkoutSuccess() }}</p>
        }
        @if (cartService.cartItems().length === 0) {
          <p>Your cart is empty.</p>
        } @else {
          <ul class="cart-list">
            @for (item of cartService.cartItems(); track item.product.id) {
              <li>
                <div>
                  <strong>{{ item.product.name ?? item.product.title }}</strong>
                  <p>Price: {{ item.product.price | currency }}</p>
                  <p>Quantity: {{ item.quantity }}</p>
                </div>
                <div class="actions">
                  <button type="button" (click)="decreaseQuantity(item.product.id)">-</button>
                  <button type="button" (click)="increaseQuantity(item.product.id)">+</button>
                  <button type="button" (click)="removeFromCart(item.product.id)">Remove</button>
                </div>
              </li>
            }
          </ul>
        }
        <p><strong>Total Items:</strong> {{ cartService.itemCount() }}</p>
        <p><strong>Total Price:</strong> {{ cartService.cartTotal() | currency }}</p>
        <div class="checkout-actions">
          <button type="button" (click)="checkout()" [disabled]="cartService.cartItems().length === 0 || isCheckingOut()">
            {{ isCheckingOut() ? 'Processing Checkout...' : 'Checkout' }}
          </button>
          <button type="button" class="clear-btn" (click)="clearCart()" [disabled]="cartService.cartItems().length === 0 || isCheckingOut()">Clear Cart</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.cart-card { max-width: 700px; margin: 0 auto; padding: 1.75rem; border: 1px solid #dbe3ef; border-radius: 18px; background: #ffffff; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); color: #111827; }`,
    `.cart-card h2, .cart-card h3 { margin: 0 0 0.85rem; color: #0f172a; font-weight: 800; }`,
    `.cart-card h2 { font-size: 1.9rem; }`,
    `.cart-card h3 { font-size: 1.25rem; }`,
    `.cart-list strong { display: block; color: #111827; font-size: 1rem; }`,
    `.cart-list p, .summary p { margin: 0.25rem 0 0; color: #334155; font-size: 0.98rem; }`,
    `button { padding: 0.68rem 1rem; border: 0; border-radius: 10px; background: #2563eb; color: #ffffff; font-weight: 700; cursor: pointer; box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2); }`,
    `button:hover:not([disabled]) { filter: brightness(1.05); }`,
    `.summary { padding-top: 1rem; border-top: 1px solid #e2e8f0; }`,
    `.cart-list { list-style: none; padding: 0; display: grid; gap: 0.75rem; }`,
    `.cart-list li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; }`,
    `.actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }`,
    `.summary > p { font-size: 1rem; font-weight: 600; color: #0f172a; }`,
    `.checkout-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }`,
    `.checkout-step { margin: 0.25rem 0 0.75rem; color: #1d4ed8; }`,
    `.checkout-success { margin: 0.25rem 0 0.75rem; color: #15803d; }`,
    `.checkout-error { margin: 0.25rem 0 0.75rem; color: #b91c1c; }`,
    `.clear-btn { margin-top: 0.75rem; background: #111827; }`,
    `button[disabled] { opacity: 0.6; cursor: not-allowed; box-shadow: none; }`,
    `@media (max-width: 640px) { .cart-card { padding: 1.2rem; } .product-item, .cart-list li { flex-direction: column; align-items: flex-start; } .actions { width: 100%; } }`
  ]
})
export class ShoppingCartComponent {
  readonly isCheckingOut = signal(false);
  readonly currentStep = signal<string | null>(null);
  readonly checkoutSuccess = signal<string | null>(null);
  readonly checkoutError = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
    private readonly authService: AuthService
  ) {}

  increaseQuantity(productId: number): void {
    const currentItem = this.cartService.cartItems().find((item) => item.product.id === productId);
    if (!currentItem) {
      return;
    }

    this.cartService.updateQuantity(productId, currentItem.quantity + 1);
  }

  decreaseQuantity(productId: number): void {
    const currentItem = this.cartService.cartItems().find((item) => item.product.id === productId);
    if (!currentItem) {
      return;
    }

    this.cartService.updateQuantity(productId, currentItem.quantity - 1);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  checkout(): void {
    const cartItems = this.cartService.cartItems();
    if (cartItems.length === 0 || this.isCheckingOut()) {
      return;
    }

    const context: CheckoutContext = {
      cartItems,
      totalAmount: this.cartService.cartTotal(),
      customerEmail: this.authService.currentUser()?.email ?? 'guest@shopsmart.local'
    };

    this.checkoutError.set(null);
    this.checkoutSuccess.set(null);
    this.isCheckingOut.set(true);

    const checkoutFlow$: Observable<CreatedOrder> = of(context).pipe(
      tap(() => this.currentStep.set('1/4 Creating order...')),
      concatMap((checkoutContext) => this.checkoutService.createOrder(checkoutContext).pipe(
        map((order) => ({ checkoutContext, order }))
      )),
      tap(() => this.currentStep.set('2/4 Reserving inventory...')),
      concatMap(({ checkoutContext, order }) => this.checkoutService.reserveInventory(order.orderId, checkoutContext.cartItems).pipe(
        map(() => ({ checkoutContext, order }))
      )),
      tap(() => this.currentStep.set('3/4 Processing payment...')),
      concatMap(({ checkoutContext, order }) => this.checkoutService.processPayment(order.orderId, checkoutContext.totalAmount).pipe(
        map(() => ({ checkoutContext, order }))
      )),
      tap(() => this.currentStep.set('4/4 Sending confirmation email...')),
      concatMap(({ checkoutContext, order }) => this.checkoutService.sendConfirmationEmail(order.orderId, checkoutContext.customerEmail).pipe(
        map(() => order)
      ))
    );

    checkoutFlow$.pipe(
      finalize(() => this.isCheckingOut.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (order: CreatedOrder) => {
        this.currentStep.set(null);
        this.checkoutSuccess.set(`Checkout completed successfully. Order #${order.orderId} is confirmed.`);
        this.cartService.clearCart();
      },
      error: (error: unknown) => {
        this.currentStep.set(null);
        const message = error instanceof Error ? error.message : 'Checkout failed. Please try again.';
        this.checkoutError.set(message);
      }
    });
  }
}
