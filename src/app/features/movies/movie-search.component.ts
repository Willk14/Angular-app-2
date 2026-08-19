import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, map, of, switchMap, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface Movie {
  id: number;
  title: string;
  poster_path?: string | null;
  overview?: string;
}

@Component({
  selector: 'app-movie-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="movie-search-card">
      <h2>Movie Search</h2>
      <label class="search-box">
        <span class="sr-only">Search movies</span>
        <input type="search" [formControl]="searchControl" placeholder="Search movies" />
      </label>

      @if (loading()) {
        <p class="status">Loading movies…</p>
      } @else if (movies().length === 0 && hasSearched()) {
        <p class="status empty">No movies found</p>
      } @else if (movies().length > 0) {
        <ul class="movie-list">
          @for (movie of movies(); track movie.id) {
            <li class="movie-item">
              @if (movie.poster_path) {
                <img [src]="'https://image.tmdb.org/t/p/w92' + movie.poster_path" [alt]="movie.title" />
              }
              <div>
                <strong>{{ movie.title }}</strong>
                @if (movie.overview) {
                  <p>{{ movie.overview }}</p>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.movie-search-card { max-width: 680px; margin: 0 auto; padding: 1.5rem; border: 1px solid #d0d7de; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }`,
    `.search-box { display: block; margin-bottom: 1rem; }`,
    `input { width: 100%; padding: 0.8rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; }`,
    `.movie-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }`,
    `.movie-item { display: flex; gap: 0.85rem; align-items: flex-start; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; }`,
    `img { width: 56px; height: 84px; object-fit: cover; border-radius: 6px; }`,
    `.status { color: #475569; font-weight: 600; }`,
    `.status.empty { color: #b91c1c; }`,
    `.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }`
  ]
})
export class MovieSearchComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('');
  readonly movies = signal<Movie[]>([]);
  readonly loading = signal(false);
  readonly hasSearched = signal(false);

  private readonly destroy$ = new Subject<void>();
  private readonly apiKey = '3fbbf7a5f2d69f4ddfbabaa60178d4c0';
  private readonly baseUrl = 'https://api.themoviedb.org/3/search/movie';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value) => {
        const query = (value ?? '').trim();
        this.hasSearched.set(Boolean(query));

        if (!query) {
          this.movies.set([]);
          this.loading.set(false);
          return of([] as Movie[]);
        }

        this.loading.set(true);
        return this.http.get<{ results: Movie[] }>(this.baseUrl, {
          params: { api_key: this.apiKey, query }
        }).pipe(
          map((response: { results: Movie[] }) => response.results ?? []),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results: Movie[]) => this.movies.set(results),
      error: () => {
        this.movies.set([]);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
