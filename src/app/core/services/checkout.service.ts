import { Injectable } from '@angular/core';
import { CartItem } from './cart.service';
import { defer, delay, Observable, of, throwError } from 'rxjs';

export interface CheckoutContext {
  cartItems: CartItem[];
  totalAmount: number;
  customerEmail: string;
}

export interface CreatedOrder {
  orderId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  createOrder(context: CheckoutContext): Observable<CreatedOrder> {
    if (context.cartItems.length === 0) {
      return throwError(() => new Error('Your cart is empty. Add items before checkout.'));
    }

    return defer(() => of({ orderId: Date.now() })).pipe(delay(500));
  }

  reserveInventory(orderId: number, cartItems: CartItem[]): Observable<{ reserved: true }> {
    const hasInvalidQuantity = cartItems.some((item) => item.quantity <= 0);
    if (hasInvalidQuantity) {
      return throwError(() => new Error(`Inventory reservation failed for order #${orderId}.`));
    }

    return defer(() => of({ reserved: true as const })).pipe(delay(500));
  }

  processPayment(orderId: number, totalAmount: number): Observable<{ paid: true }> {
    if (totalAmount <= 0) {
      return throwError(() => new Error(`Payment failed for order #${orderId}.`));
    }

    return defer(() => of({ paid: true as const })).pipe(delay(500));
  }

  sendConfirmationEmail(orderId: number, customerEmail: string): Observable<{ sent: true }> {
    if (!customerEmail.includes('@')) {
      return throwError(() => new Error(`Confirmation email failed for order #${orderId}.`));
    }

    return defer(() => of({ sent: true as const })).pipe(delay(500));
  }
}
