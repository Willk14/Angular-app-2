import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="counter-card">
      <h2>Counter Dashboard</h2>
      <p><strong>Current Count:</strong> {{ count() }}</p>
      <p><strong>Double Count:</strong> {{ doubleCount() }}</p>
      <p><strong>Count is:</strong> {{ isEven() ? 'Even' : 'Odd' }}</p>

      <div class="actions">
        <button (click)="increment()">Increment</button>
        <button (click)="decrement()">Decrement</button>
        <button (click)="reset()">Reset</button>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.counter-card { max-width: 420px; margin: 0 auto; padding: 1.5rem; border: 1px solid #d0d7de; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }`,
    `.actions { display: flex; gap: 0.75rem; margin-top: 1rem; }`,
    `button { padding: 0.65rem 0.9rem; border: 0; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; }`
  ]
})
export class CounterComponent {
  readonly count = signal(0);
  readonly doubleCount = computed(() => this.count() * 2);
  readonly isEven = computed(() => this.count() % 2 === 0);

  increment() {
    this.count.update((value) => value + 1);
  }

  decrement() {
    this.count.update((value) => value - 1);
  }

  reset() {
    this.count.set(0);
  }
}
