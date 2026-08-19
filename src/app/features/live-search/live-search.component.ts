import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-live-search',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="search-card">
      <h2>Search</h2>
      <label class="search-box">
        <span class="sr-only">Search users</span>
        <input type="text" [value]="search()" (input)="search.set($any($event.target).value)" placeholder="Type to filter" />
      </label>

      <ul class="user-list">
        @for (user of filteredUsers(); track user) {
          <li>{{ user }}</li>
        }
      </ul>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.search-card { max-width: 480px; margin: 0 auto; padding: 1.5rem; border: 1px solid #d0d7de; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }`,
    `.search-box { display: block; margin-bottom: 1rem; }`,
    `input { width: 100%; padding: 0.8rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; }`,
    `.user-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.45rem; }`,
    `.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }`
  ]
})
export class LiveSearchComponent {
  readonly users = ['John', 'Jane', 'James', 'Jill', 'Jack'];
  readonly search = signal('');
  readonly filteredUsers = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.users;
    }

    return this.users.filter((user) => user.toLowerCase().includes(query));
  });
}
