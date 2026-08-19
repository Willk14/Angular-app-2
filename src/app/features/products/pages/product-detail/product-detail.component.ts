import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { httpResource, HttpClientModule } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { map } from 'rxjs/operators';

import { CartService } from '../../../../core/services/cart.service';
import type { Category, Product } from '../../../../core/models';

interface ApiProduct extends Omit<Product, 'categoryId' | 'categoryName'> {
  categoryId?: number;
  categoryName?: string;
  category?: Pick<Category, 'id' | 'name'>;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ButtonModule, MessageModule, SkeletonModule, RouterLink],
  template: `
    <section class="product-detail-page">
      @if (loading()) {
        <div class="detail-skeleton">
          <p-skeleton width="100%" height="320px"></p-skeleton>
          <div class="detail-skeleton-info">
            <p-skeleton width="70%" height="2rem"></p-skeleton>
            <p-skeleton width="40%" height="1.5rem"></p-skeleton>
            <p-skeleton width="100%" height="4rem"></p-skeleton>
          </div>
        </div>
      } @else if (errorMessage()) {
        <div class="error-message">
          <p-message severity="error" [text]="errorMessage() ?? 'Unable to load product details.'"></p-message>
        </div>
      } @else if (product(); as currentProduct) {
        <div class="detail-layout">
          <div class="gallery">
            <img [src]="currentImage()" [alt]="currentProduct.title" class="main-image" />

            @if (images().length > 1) {
              <div class="gallery-controls">
                <button type="button" class="gallery-button" (click)="previousImage()">←</button>
                <button type="button" class="gallery-button" (click)="nextImage()">→</button>
              </div>

              <div class="thumbnail-row">
                @for (image of images(); track image; let index = $index) {
                  <button
                    type="button"
                    class="thumbnail"
                    [class.active]="selectedImageIndex() === index"
                    (click)="selectImage(index)"
                  >
                    <img [src]="image" [alt]="currentProduct.title + ' image ' + (index + 1)" />
                  </button>
                }
              </div>
            }
          </div>

          <div class="product-info">
            <span class="category-badge">{{ categoryName() }}</span>
            <h1>{{ currentProduct.title }}</h1>
            <p class="price">{{ currentProduct.price | currency }}</p>
            <p class="description">{{ currentProduct.description || 'No description is available for this product yet.' }}</p>

            <div class="actions">
              <label class="quantity-control">
                <span>Quantity</span>
                <select [value]="quantity()" (change)="onQuantityChange($event)">
                  @for (value of [1, 2, 3, 4, 5]; track value) {
                    <option [value]="value">{{ value }}</option>
                  }
                </select>
              </label>

              <button type="button" pButton icon="pi pi-shopping-cart" label="Add to Cart" (click)="addToCart(currentProduct)"></button>
            </div>
          </div>
        </div>

        <section class="related-products">
          <h2>Related Products</h2>

          @if (relatedProducts().length) {
            <div class="related-grid">
              @for (related of relatedProducts(); track related.id) {
                <a class="related-card" [routerLink]="['/products', related.id]">
                  <img [src]="related.images?.[0] ?? 'assets/placeholder.png'" [alt]="related.title" />
                  <div>
                    <h3>{{ related.title }}</h3>
                    <p>{{ related.price | currency }}</p>
                  </div>
                </a>
              }
            </div>
          } @else {
            <p>No related products available right now.</p>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.product-detail-page { display: grid; gap: 2rem; }`,
    `.detail-layout { display: grid; gap: 2rem; grid-template-columns: minmax(280px, 1.2fr) minmax(280px, 1fr); align-items: start; }`,
    `.gallery { display: grid; gap: 0.75rem; }`,
    `.main-image { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; background: #f3f4f6; }`,
    `.gallery-controls { display: flex; gap: 0.5rem; }`,
    `.gallery-button, .thumbnail { border: 1px solid #d0d7de; background: white; border-radius: 8px; cursor: pointer; }`,
    `.gallery-button { padding: 0.5rem 0.75rem; }`,
    `.thumbnail-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }`,
    `.thumbnail { padding: 0.25rem; }`,
    `.thumbnail img { width: 64px; height: 64px; object-fit: cover; border-radius: 6px; }`,
    `.thumbnail.active { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }`,
    `.product-info { display: grid; gap: 1rem; }`,
    `.category-badge { display: inline-block; width: fit-content; padding: 0.35rem 0.75rem; border-radius: 999px; background: #e0f2fe; color: #075985; font-size: 0.9rem; }`,
    `.price { font-size: 1.4rem; font-weight: 700; margin: 0; }`,
    `.description { line-height: 1.6; margin: 0; }`,
    `.actions { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }`,
    `.quantity-control { display: grid; gap: 0.35rem; }`,
    `.quantity-control select { padding: 0.55rem 0.75rem; border: 1px solid #d0d7de; border-radius: 6px; }`,
    `.related-products { display: grid; gap: 1rem; }`,
    `.related-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }`,
    `.related-card { display: grid; gap: 0.75rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 10px; text-decoration: none; color: inherit; }`,
    `.related-card img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; }`,
    `.detail-skeleton { display: grid; gap: 1rem; }`,
    `.detail-skeleton-info { display: grid; gap: 0.75rem; }`,
    `.error-message { max-width: 480px; }`
  ]
})
export class ProductDetailComponent {
  private readonly apiUrl = 'http://localhost:3001/api/v1';
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);

  readonly productId = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = Number(params.get('id'));
        return Number.isFinite(id) && id > 0 ? id : null;
      })
    ),
    { initialValue: null }
  );

  readonly productResource = httpResource<Product | null>(() => {
    const id = this.productId();
    if (id == null) {
      return undefined;
    }

    return { url: `${this.apiUrl}/products/${id}` };
  }, {
    defaultValue: null,
    parse: (body) => this.normalizeProduct(body as ApiProduct)
  });

  readonly relatedProductsResource = httpResource<Product[]>(() => {
    const id = this.productId();
    if (id == null) {
      return undefined;
    }

    return { url: `${this.apiUrl}/products/${id}/related` };
  }, {
    defaultValue: [],
    parse: (body) => this.normalizeProducts((body ?? []) as ApiProduct[])
  });

  readonly categoriesResource = httpResource<Category[]>(() => ({
    url: `${this.apiUrl}/categories`
  }), {
    defaultValue: []
  });

  readonly product = computed(() => this.productResource.value());
  readonly relatedProducts = computed(() => this.relatedProductsResource.value());
  readonly categories = computed(() => this.categoriesResource.value());
  readonly loading = computed(() =>
    this.productId() != null
      && (this.productResource.isLoading() || this.relatedProductsResource.isLoading() || this.categoriesResource.isLoading())
  );
  readonly errorMessage = computed(() => {
    if (this.productId() == null) {
      return 'Invalid product ID.';
    }

    if (this.productResource.error() || this.relatedProductsResource.error() || this.categoriesResource.error()) {
      return 'Unable to load product details. Please try again later.';
    }

    return null;
  });

  readonly selectedImageIndex = signal(0);
  readonly quantity = signal(1);
  readonly images = computed(() => this.product()?.images?.filter(Boolean) ?? []);
  readonly currentImage = computed(() => {
    const images = this.images();
    if (!images.length) {
      return 'assets/placeholder.png';
    }

    const index = Math.min(this.selectedImageIndex(), images.length - 1);
    return images[index];
  });
  readonly categoryName = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) {
      return 'Uncategorized';
    }

    const category = this.categories().find((item) => item.id === currentProduct.categoryId);
    return category?.name ?? (currentProduct.categoryId ? `Category ${currentProduct.categoryId}` : 'Uncategorized');
  });

  previousImage() {
    if (this.images().length === 0) {
      return;
    }

    this.selectedImageIndex.set((this.selectedImageIndex() + this.images().length - 1) % this.images().length);
  }

  nextImage() {
    if (this.images().length === 0) {
      return;
    }

    this.selectedImageIndex.set((this.selectedImageIndex() + 1) % this.images().length);
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
  }

  onQuantityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.quantity.set(Number(target.value));
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, this.quantity());
  }

  private normalizeProducts(products: ApiProduct[]): Product[] {
    return products.map((product) => this.normalizeProduct(product));
  }

  private normalizeProduct(product: ApiProduct): Product {
    return {
      ...product,
      categoryId: product.categoryId ?? product.category?.id,
      categoryName: product.categoryName ?? product.category?.name,
      name: product.name ?? product.title
    };
  }
}
