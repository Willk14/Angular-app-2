import { Component } from '@angular/core';
import { CounterComponent } from '../../features/counter/counter.component';

@Component({
  selector: 'app-counter-page',
  standalone: true,
  imports: [CounterComponent],
  template: `
    <section class="page-shell">
      <app-counter />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 720px; margin: 0 auto; }`
  ]
})
export class CounterPageComponent {}
