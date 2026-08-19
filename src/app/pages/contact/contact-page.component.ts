import { Component } from '@angular/core';
import { ContactComponent } from '../../features/contact/contact.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ContactComponent],
  template: `
    <section class="page-shell">
      <app-contact />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 980px; margin: 0 auto; }`
  ]
})
export class ContactPageComponent {}
