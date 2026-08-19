import { signal } from '@angular/core';

export class ProductStateService {
  searchQuery = signal<string>('');
  selectedCategoryId = signal<number | null>(null);

  updateSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
  }
}
