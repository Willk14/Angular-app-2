import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  email = '';
  subscribed = false;

  featuredProducts = [
    { name: 'Aurora Headphones', category: 'Electronics', price: 129 },
    { name: 'Lumen Jacket', category: 'Fashion', price: 89 },
    { name: 'Nord Lamp', category: 'Home & Living', price: 74 },
    { name: 'Vista Notebook', category: 'Books', price: 24 },
    { name: 'Nova Speaker', category: 'Electronics', price: 99 },
    { name: 'Harbor Backpack', category: 'Fashion', price: 64 }
  ];

  subscribe(): void {
    if (!this.email.trim()) {
      return;
    }

    this.subscribed = true;
    this.email = '';
  }
}
