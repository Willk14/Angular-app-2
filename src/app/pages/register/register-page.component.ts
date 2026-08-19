import { Component } from '@angular/core';
import { UsernameAvailabilityComponent } from '../../features/registration/username-availability.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [UsernameAvailabilityComponent],
  template: `
    <section class="page-shell">
      <app-username-availability />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 720px; margin: 0 auto; }`
  ]
})
export class RegisterPageComponent {}
