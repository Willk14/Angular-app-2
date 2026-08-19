import { Component } from '@angular/core';
import { ProductListComponent } from '../../features/products/pages/product-list/product-list.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [ProductListComponent],
  template: `
    <section class="page-shell">
      <app-product-list />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 1200px; margin: 0 auto; }`
  ]
})
export class ProductsPageComponent {}
