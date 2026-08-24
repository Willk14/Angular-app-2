import { Injectable, computed, effect, inject, signal, untracked, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models';
import { NotificationService } from '../../features/notifications/notification.service';
import { AuthService } from './auth.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly cartStorageKey = 'cartItems';

  cartItems = signal<CartItem[]>([]);

  cartTotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.product.price * item.quantity, 0)
  );

  itemCount = computed(() =>
    this.cartItems().reduce((count, item) => count + item.quantity, 0)
  );

  constructor() {
    this.cartItems.set(this.authService.isAuthenticated() ? this.loadFromStorage() : []);

    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();

      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      untracked(() => {
        if (!isAuthenticated) {
          localStorage.removeItem(this.cartStorageKey);
          if (this.cartItems().length > 0) {
            this.cartItems.set([]);
          }
          return;
        }

        if (this.cartItems().length === 0) {
          const stored = this.loadFromStorage();
          if (stored.length > 0) {
            this.cartItems.set(stored);
          }
        }
      });
    });

    effect(() => {
      const items = this.cartItems();

      if (isPlatformBrowser(this.platformId) && untracked(() => this.authService.isAuthenticated())) {
        localStorage.setItem(this.cartStorageKey, JSON.stringify(items));
      }
    });
  }

  addToCart(product: Product, quantity = 1): void {
    if (!this.authService.isAuthenticated()) {
      this.notificationService.showWarning('Please log in before adding items to your cart.');
      return;
    }

    this.cartItems.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);

      if (existing) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [...items, { product, quantity }];
    });

    const productName = product.title || product.name || 'Item';
    const quantityLabel = quantity > 1 ? `${quantity} items` : '1 item';
    this.notificationService.showSuccess(`${productName} added to cart (${quantityLabel}).`);
  }

  removeFromCart(productId: number): void {
    this.cartItems.update((items) => items.filter((item) => item.product.id !== productId));
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cartItems.update((items) =>
      items.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  getCartItems(): Product[] {
    return this.cartItems().map((item) => item.product);
  }

  getItemCount(): number {
    return this.itemCount();
  }

  getTotalPrice(): number {
    return this.cartTotal();
  }

  private loadFromStorage(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.cartStorageKey);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
