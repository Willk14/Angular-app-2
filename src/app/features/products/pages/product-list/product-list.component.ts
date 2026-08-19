import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { httpResource, HttpClientModule } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CartService } from '../../../../core/services/cart.service';
import type { Category, Product } from '../../../../core/models';

interface ApiProduct extends Omit<Product, 'categoryId' | 'categoryName'> {
  categoryId?: number;
  categoryName?: string;
  category?: Pick<Category, 'id' | 'name'>;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ProductCardComponent],
  template: `
    <section class="product-list-page">
      <div class="controls">
        <label class="search-control">
          <span class="sr-only">Search products</span>
          <input
            type="search"
            placeholder="Search by title"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
        </label>

        <label class="filter-control">
          <span>Category</span>
          <select [value]="selectedCategory() ?? ''" (change)="onCategoryChange($event)">
            <option value="">All categories</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>
      </div>

      @if (isProductsLoading()) {
        <div class="loading-state">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="loading-title">Loading products</p>
          <p class="loading-subtitle">Curating the latest picks for you...</p>
        </div>
      } @else if (productsError()) {
        <div class="error-card" role="alert" aria-live="assertive">
          <div class="error-icon" aria-hidden="true">!</div>
          <p class="error-title">Unable to load products</p>
          <p class="error-subtitle">Connection was interrupted. Please try again.</p>
          <button type="button" class="retry-button" (click)="productResource.reload()">
            Retry
          </button>
        </div>
      } @else {
        <div class="product-grid">
          @for (product of filteredProducts(); track product.id) {
            <app-product-card [product]="product" (addToCart)="addToCart($event)"></app-product-card>
          }

          @if (showEmptyState()) {
            <div class="empty-state">
              <div class="empty-icon" aria-hidden="true"></div>
              <p class="empty-title">No products found</p>
              <p class="empty-subtitle">
                {{ isResourceEmptyArray() ? 'No items are available right now.' : 'Try adjusting your search or category filters.' }}
              </p>
              @if (hasActiveFilters()) {
                <button type="button" class="clear-filters-button" (click)="clearFilters()">
                  Clear filters
                </button>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.product-list-page { display: grid; gap: 1rem; }`,
    `.controls { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }`,
    `.search-control, .filter-control { display: flex; align-items: center; gap: 0.5rem; min-width: 220px; }`,
    `.search-control input, .filter-control select { padding: 0.65rem 0.75rem; border: 1px solid #d0d7de; border-radius: 6px; }`,
    `.filter-control select option { background-color: #1f2937; color: #ffffff; }`,
    `.product-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }`,
    `.loading-state, .error-card, .empty-state { grid-column: 1/-1; }`,
    `.loading-state {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
      padding: 2rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      background:
        radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 55%),
        rgba(12, 12, 14, 0.9);
      color: rgba(255, 255, 255, 0.9);
    }`,
    `.loading-spinner {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      position: relative;
      background:
        conic-gradient(from 30deg, rgba(255, 255, 255, 0.9), rgba(148, 163, 184, 0.18), rgba(255, 255, 255, 0.9));
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
      mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.12),
        0 0 16px rgba(255, 255, 255, 0.18);
      animation: productSpinner 0.85s linear infinite;
    }`,
    `.loading-spinner::before {
      content: '';
      position: absolute;
      inset: 15px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(248, 250, 252, 0.95), rgba(148, 163, 184, 0.7));
      box-shadow: 0 0 12px rgba(248, 250, 252, 0.25);
    }`,
    `.loading-title { margin: 0.35rem 0 0; font-weight: 600; letter-spacing: 0.01em; }`,
    `.loading-subtitle { margin: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.68); }`,
    `.error-card {
      display: grid;
      justify-items: center;
      gap: 0.55rem;
      padding: 1.7rem 1rem;
      border-radius: 14px;
      border: 1px solid rgba(59, 130, 246, 0.45);
      background:
        linear-gradient(160deg, rgba(8, 12, 20, 0.98), rgba(4, 8, 16, 0.96)),
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 60%);
      box-shadow: inset 0 1px 0 rgba(125, 211, 252, 0.2), 0 12px 28px rgba(0, 0, 0, 0.42);
      color: rgba(241, 245, 249, 0.95);
      text-align: center;
    }`,
    `.error-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      color: #bfdbfe;
      border: 1px solid rgba(96, 165, 250, 0.58);
      background: rgba(30, 58, 138, 0.32);
    }`,
    `.error-title { margin: 0.25rem 0 0; font-size: 1rem; font-weight: 600; }`,
    `.error-subtitle { margin: 0; color: rgba(148, 163, 184, 0.96); font-size: 0.92rem; }`,
    `.retry-button {
      margin-top: 0.5rem;
      border: 1px solid rgba(96, 165, 250, 0.58);
      border-radius: 999px;
      padding: 0.52rem 1.15rem;
      background: linear-gradient(140deg, rgba(30, 58, 138, 0.92), rgba(59, 130, 246, 0.9));
      color: #f8fafc;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
    }`,
    `.retry-button:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(59, 130, 246, 0.36); filter: brightness(1.05); }`,
    `.retry-button:active { transform: translateY(0); filter: brightness(0.98); }`,
    `.empty-state {
      display: grid;
      justify-items: center;
      gap: 0.55rem;
      padding: 2rem 1rem;
      border-radius: 14px;
      border: 1px dashed rgba(148, 163, 184, 0.4);
      background:
        radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.12), transparent 38%),
        linear-gradient(165deg, rgba(9, 12, 18, 0.95), rgba(5, 8, 12, 0.97));
      text-align: center;
    }`,
    `.empty-icon {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      position: relative;
      background: radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.32), rgba(15, 23, 42, 0.96));
      border: 1px solid rgba(56, 189, 248, 0.38);
      box-shadow: 0 10px 25px rgba(2, 132, 199, 0.2);
    }`,
    `.empty-icon::before {
      content: '';
      position: absolute;
      left: 19px;
      top: 17px;
      width: 15px;
      height: 15px;
      border: 3px solid rgba(226, 232, 240, 0.95);
      border-radius: 50%;
    }`,
    `.empty-icon::after {
      content: '';
      position: absolute;
      left: 34px;
      top: 32px;
      width: 11px;
      height: 3px;
      border-radius: 99px;
      background: rgba(226, 232, 240, 0.95);
      transform: rotate(42deg);
    }`,
    `.empty-title { margin: 0.25rem 0 0; color: rgba(241, 245, 249, 0.96); font-size: 1rem; font-weight: 600; }`,
    `.empty-subtitle { margin: 0; color: rgba(148, 163, 184, 0.95); font-size: 0.92rem; }`,
    `.clear-filters-button {
      margin-top: 0.5rem;
      border: 1px solid rgba(56, 189, 248, 0.44);
      border-radius: 999px;
      padding: 0.5rem 1.1rem;
      background: linear-gradient(140deg, rgba(8, 47, 73, 0.92), rgba(14, 116, 144, 0.88));
      color: rgba(240, 249, 255, 0.98);
      font-weight: 600;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
    }`,
    `.clear-filters-button:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(8, 145, 178, 0.32); filter: brightness(1.04); }`,
    `.clear-filters-button:active { transform: translateY(0); filter: brightness(0.98); }`,
    `@keyframes productSpinner { to { transform: rotate(360deg); } }`,
    `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }`
  ]
})
export class ProductListComponent {
  private readonly apiUrl = 'http://localhost:3001/api/v1';

  private readonly sampleProducts: Product[] = [
    { id: 1, name: 'Laptop', title: 'Laptop', price: 1200, categoryId: 1, images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'] },
    { id: 2, name: 'Mouse', title: 'Mouse', price: 40, categoryId: 2, images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80'] },
    { id: 3, name: 'Keyboard', title: 'Keyboard', price: 90, categoryId: 2, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'] },
    { id: 4, name: 'Monitor', title: 'Monitor', price: 300, categoryId: 1, images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'] },
    { id: 5, name: 'Headphones', title: 'Headphones', price: 150, categoryId: 3, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'] },
    { id: 6, name: 'Webcam', title: 'Webcam', price: 80, categoryId: 3, images: ['https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80'] }
  ];

  readonly searchQuery = signal('');
  readonly debouncedSearchQuery = toSignal(
    toObservable(this.searchQuery).pipe(
      debounceTime(500),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );
  readonly normalizedSearchQuery = computed(() => this.debouncedSearchQuery().trim());
  readonly selectedCategory = signal<number | null>(null);
  readonly productsRequestUrl = computed(() => {
    const url = new URL(`${this.apiUrl}/products`);
    const query = this.normalizedSearchQuery();
    const categoryId = this.selectedCategory();

    if (query) {
      url.searchParams.set('q', query);
    }

    if (categoryId != null) {
      url.searchParams.set('categoryId', String(categoryId));
    }

    return url.toString();
  });

  readonly productResource = httpResource<Product[]>(() => {
    return {
      url: this.productsRequestUrl()
    };
  }, {
    defaultValue: [],
    parse: (body) => this.normalizeProducts((body ?? []) as ApiProduct[])
  });

  // Alias the built-in httpResource loading signal for template readability.
  readonly isProductsLoading = this.productResource.isLoading;
  readonly productsError = this.productResource.error;

  readonly categoriesResource = httpResource<Category[]>(() => ({
    url: `${this.apiUrl}/categories`
  }), {
    defaultValue: []
  });

  readonly categories = computed(() => this.categoriesResource.value());
  readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim().length > 0 || this.selectedCategory() != null
  );
  readonly isResourceEmptyArray = computed(() =>
    !this.productResource.isLoading() && !this.productResource.error() && this.productResource.value().length === 0
  );
  readonly showEmptyState = computed(() =>
    !this.productResource.isLoading() && !this.productResource.error() && this.filteredProducts().length === 0
  );

  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedCategory = this.selectedCategory();
    const products = this.productResource.error() ? this.sampleProducts : this.productResource.value();

    return products.filter((product) => {
      const matchesTitle = !query || product.title.toLowerCase().includes(query);
      const matchesCategory = this.productResource.error()
        ? selectedCategory == null || product.categoryId === selectedCategory
        : true;
      return matchesTitle && matchesCategory;
    });
  });

  constructor(private readonly cartService: CartService) {}

  onCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedCategory.set(value ? Number(value) : null);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
  }

  private normalizeProducts(products: ApiProduct[]): Product[] {
    return products.map((product) => ({
      ...product,
      categoryId: product.categoryId ?? product.category?.id,
      categoryName: product.categoryName ?? product.category?.name,
      name: product.name ?? product.title
    }));
  }
}
