import { Component } from '@angular/core';
import { ShoppingCartComponent } from '../../features/shopping-cart/shopping-cart.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [ShoppingCartComponent],
  template: `
    <section class="page-shell">
      <app-shopping-cart />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 900px; margin: 0 auto; }`
  ]
})
export class CartPageComponent {}
