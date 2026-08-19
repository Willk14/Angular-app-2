import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, finalize, of, switchMap, takeUntil } from 'rxjs';

interface Country {
  name: {
    common: string;
    official?: string;
  };
  capital?: string[];
  population?: number;
  region?: string;
  flags?: {
    png?: string;
  };
}

@Component({
  selector: 'app-country-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="country-search-card">
      <h2>Search Country</h2>
      <label class="search-box">
        <span class="sr-only">Search country</span>
        <input type="search" [formControl]="searchControl" placeholder="Type a country name" />
      </label>

      @if (loading()) {
        <p class="status">Loading country…</p>
      } @else if (errorMessage()) {
        <p class="status error">{{ errorMessage() }}</p>
      } @else if (countries().length > 0) {
        <div class="results">
          @for (country of countries(); track country.name.common) {
            <article class="country-card">
              @if (country.flags?.png) {
                <img [src]="country.flags?.png" [alt]="country.name.common" />
              }
              <div>
                <h3>{{ country.name.common }}</h3>
                <p><strong>Capital:</strong> {{ country.capital?.[0] || 'N/A' }}</p>
                <p><strong>Population:</strong> {{ country.population?.toLocaleString() || 'N/A' }}</p>
                <p><strong>Region:</strong> {{ country.region || 'N/A' }}</p>
              </div>
            </article>
          }
        </div>
      } @else if (hasSearched()) {
        <p class="status empty">No countries found</p>
      }
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.country-search-card { max-width: 680px; margin: 0 auto; padding: 1.5rem; border: 1px solid #d0d7de; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }`,
    `.search-box { display: block; margin-bottom: 1rem; }`,
    `input { width: 100%; padding: 0.8rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; }`,
    `.country-card { display: flex; gap: 0.9rem; align-items: center; padding: 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 0.75rem; }`,
    `img { width: 56px; height: 36px; object-fit: cover; border-radius: 4px; }`,
    `.status { color: #475569; font-weight: 600; }`,
    `.status.error { color: #b91c1c; }`,
    `.status.empty { color: #92400e; }`,
    `.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }`
  ]
})
export class CountrySearchComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('');
  readonly countries = signal<Country[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hasSearched = signal(false);

  private readonly destroy$ = new Subject<void>();
  private readonly apiUrl = 'https://restcountries.com/v3.1/name';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value) => {
        const query = (value ?? '').trim();
        this.hasSearched.set(Boolean(query));

        if (!query) {
          this.countries.set([]);
          this.errorMessage.set(null);
          this.loading.set(false);
          return of([] as Country[]);
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        return this.http.get<Country[]>(`${this.apiUrl}/${encodeURIComponent(query)}`).pipe(
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results: Country[]) => this.countries.set(results),
      error: () => {
        this.countries.set([]);
        this.errorMessage.set('Unable to load countries right now.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
