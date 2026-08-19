import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import type { Product } from '../../../../core/models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <img
          [src]="product().images?.[0] ?? 'assets/placeholder.png'"
          [alt]="product().title"
          class="product-image"
        />
      </ng-template>

      <div class="product-card-body">
        <h3>{{ product().name ?? product().title }}</h3>
        <p class="product-category">Category: {{ product().categoryName ?? (product().categoryId ? 'Category ' + product().categoryId : 'General') }}</p>
        <p class="product-price">{{ product().price | currency }}</p>
      </div>

      <ng-template pTemplate="footer">
        <button
          type="button"
          pButton
          label="Add to Cart"
          icon="pi pi-shopping-cart"
          class="p-button-sm"
          (click)="addToCart.emit(product())"
        ></button>
      </ng-template>
    </p-card>
  `,
  styles: [
    `:host { display: block; }`,
    `.product-image { width: 100%; height: auto; object-fit: cover; }`,
    `.product-card-body { padding: 1rem 0; }`,
    `.product-category { margin: 0.35rem 0 0; color: #64748b; }`,
    `.product-price { margin: 0.5rem 0 0; font-weight: 700; }`
  ]
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
