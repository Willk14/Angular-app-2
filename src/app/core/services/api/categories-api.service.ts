import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class CategoriesApiService {
  private readonly apiUrl = 'http://localhost:3001/api/v1';

  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }
}
