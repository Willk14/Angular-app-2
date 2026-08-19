import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Category, Product } from '../../models';

interface ApiProduct extends Omit<Product, 'categoryId' | 'categoryName'> {
  categoryId?: number;
  categoryName?: string;
  category?: Pick<Category, 'id' | 'name'>;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsApiService {
  private readonly apiUrl = 'http://localhost:3001/api/v1';

  constructor(private readonly http: HttpClient) {}

  getProducts(searchQuery?: string): Observable<Product[]> {
    const params = searchQuery ? new HttpParams().set('q', searchQuery) : undefined;
    return this.http.get<ApiProduct[]>(`${this.apiUrl}/products`, { params }).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    const trimmedQuery = query.trim();
    const params = trimmedQuery ? new HttpParams().set('q', trimmedQuery) : undefined;
    return this.http.get<ApiProduct[]>(`${this.apiUrl}/products`, { params }).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<ApiProduct>(`${this.apiUrl}/products/${id}`).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  getRelatedProducts(id: number): Observable<Product[]> {
    return this.http.get<ApiProduct[]>(`${this.apiUrl}/products/${id}/related`).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.put<ApiProduct>(`${this.apiUrl}/products/${id}`, data).pipe(
      map((product) => this.normalizeProduct(product))
    );
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
