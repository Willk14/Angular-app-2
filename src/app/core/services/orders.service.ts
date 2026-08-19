import { Injectable, signal } from '@angular/core';

export interface Order {
  id: number;
  total: number;
  status: 'completed' | 'processing' | 'cancelled';
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  readonly orders = signal<Order[]>([
    { id: 101, total: 320, status: 'completed' },
    { id: 102, total: 149.99, status: 'completed' },
    { id: 103, total: 89.5, status: 'processing' }
  ]);
}
