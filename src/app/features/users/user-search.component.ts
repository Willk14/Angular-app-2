import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="search-card">
      <h2>Search Users</h2>
      <input type="text" [formControl]="searchControl" placeholder="Search users" />

      <div class="results">
        <h3>Results:</h3>
        @if (filteredUsers.length) {
          <ul>
            @for (user of filteredUsers; track user) {
              <li>{{ user }}</li>
            }
          </ul>
        } @else {
          <p>No users found.</p>
        }
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.search-card { max-width: 480px; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; background: white; display: grid; gap: 1rem; }`,
    `input { padding: 0.7rem; border: 1px solid #d1d5db; border-radius: 6px; }`,
    `ul { margin: 0; padding-left: 1.25rem; display: grid; gap: 0.35rem; }`
  ]
})
export class UserSearchComponent {
  readonly searchControl = new FormControl('');
  readonly users = [
    'John Doe',
    'Jane Smith',
    'Emily Johnson',
    'Michael Brown',
    'Sarah Wilson',
    'David Lee',
    'Laura Martinez',
    'James Taylor',
    'Olivia Anderson',
    'Daniel Thomas'
  ];
  filteredUsers: string[] = [];

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        const query = (value ?? '').trim().toLowerCase();
        this.filteredUsers = this.users.filter((user) => user.toLowerCase().includes(query));
      });
  }
}
