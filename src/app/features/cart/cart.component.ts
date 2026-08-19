import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule],
  template: `
    <section class="cart-page">
      <div class="cart-card">
        <div class="cart-header">
          <h1>Your Cart</h1>
          <p>{{ cartService.itemCount() }} item(s)</p>
        </div>

        @if (cartService.cartItems().length === 0) {
          <div class="empty-state">
            <p>Your cart is empty.</p>
          </div>
        } @else {
          <div class="cart-list">
            @for (item of cartService.cartItems(); track item.product.id) {
              <div class="cart-item">
                <img [src]="item.product.images?.[0] ?? 'assets/placeholder.png'" [alt]="item.product.title" />
                <div class="item-details">
                  <h3>{{ item.product.name ?? item.product.title }}</h3>
                  <p>Unit price: {{ item.product.price | currency }}</p>
                  <div class="quantity-controls">
                    <button type="button" pButton severity="secondary" label="-" (click)="cartService.updateQuantity(item.product.id, item.quantity - 1)"></button>
                    <span>{{ item.quantity }}</span>
                    <button type="button" pButton severity="secondary" label="+" (click)="cartService.updateQuantity(item.product.id, item.quantity + 1)"></button>
                  </div>
                </div>
                <div class="item-total">
                  <strong>{{ item.product.price * item.quantity | currency }}</strong>
                  <button type="button" pButton severity="danger" text label="Remove" (click)="cartService.removeFromCart(item.product.id)"></button>
                </div>
              </div>
            }
          </div>
        }

        <div class="cart-footer">
          <div>
            <strong>Total:</strong>
            <p>{{ cartService.cartTotal() | currency }}</p>
          </div>
          <button type="button" pButton label="Checkout" (click)="checkout()"></button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.cart-page { display: flex; justify-content: center; }`,
    `.cart-card { width: min(100%, 800px); display: grid; gap: 1rem; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; background: white; }`,
    `.cart-header, .cart-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }`,
    `.cart-list { display: grid; gap: 1rem; }`,
    `.cart-item { display: grid; gap: 1rem; grid-template-columns: 72px 1fr auto; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }`,
    `.cart-item img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }`,
    `.item-details { display: grid; gap: 0.4rem; }`,
    `.quantity-controls { display: flex; align-items: center; gap: 0.5rem; }`,
    `.item-total { display: grid; gap: 0.5rem; justify-items: end; }`,
    `.empty-state { padding: 1rem 0; color: #6b7280; }`
  ]
})
export class CartComponent {
  constructor(readonly cartService: CartService) {}

  checkout() {
    this.cartService.clearCart();
    window.alert('Checkout placeholder — your cart has been cleared.');
  }
}
