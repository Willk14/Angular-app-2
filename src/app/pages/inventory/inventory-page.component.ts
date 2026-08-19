import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

interface InventoryItem {
  name: string;
  stock: number;
  price: number;
}

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="inventory-shell">
      <div class="summary-grid">
        <article class="card">
          <h3>Product Inventory</h3>
          <p>{{ inventory().length }}</p>
        </article>
        <article class="card">
          <h3>Total Inventory Value</h3>
          <p>{{ totalInventoryValue() | currency }}</p>
        </article>
        <article class="card">
          <h3>Out of Stock Products</h3>
          <p>{{ outOfStockCount() }}</p>
        </article>
        <article class="card">
          <h3>Most Expensive Product</h3>
          <p>{{ mostExpensiveProduct().name }} ({{ mostExpensiveProduct().price | currency }})</p>
        </article>
      </div>

      <div class="inventory-list">
        @for (item of inventory(); track item.name) {
          <article class="inventory-item">
            <div>
              <strong>{{ item.name }}</strong>
              <p>Stock: {{ item.stock }}</p>
            </div>
            <span>{{ item.price | currency }}</span>
          </article>
        }
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.inventory-shell { max-width: 980px; margin: 0 auto; display: grid; gap: 1rem; }`,
    `.summary-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }`,
    `.card, .inventory-item { padding: 1rem; border-radius: 14px; background: #fff; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }`,
    `.inventory-list { display: grid; gap: 0.75rem; }`,
    `.inventory-item { display: flex; justify-content: space-between; align-items: center; }`
  ]
})
export class InventoryPageComponent {
  readonly inventory = signal<InventoryItem[]>([
    { name: 'Laptop', stock: 12, price: 1200 },
    { name: 'Mouse', stock: 0, price: 40 },
    { name: 'Keyboard', stock: 8, price: 90 },
    { name: 'Monitor', stock: 5, price: 300 }
  ]);

  readonly totalInventoryValue = computed(() =>
    this.inventory().reduce((sum, item) => sum + item.price * item.stock, 0)
  );

  readonly outOfStockCount = computed(() => this.inventory().filter((item) => item.stock === 0).length);
  readonly mostExpensiveProduct = computed(() =>
    [...this.inventory()].sort((a, b) => b.price - a.price)[0]
  );
}
