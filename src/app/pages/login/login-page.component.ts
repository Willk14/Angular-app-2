import { Component } from '@angular/core';
import { LoginPageComponent as LoginFeatureComponent } from '../../features/login-page/login-page.component';

@Component({
  selector: 'app-login-route-page',
  standalone: true,
  imports: [LoginFeatureComponent],
  template: `
    <section class="page-shell">
      <app-login-page />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 720px; margin: 0 auto; }`
  ]
})
export class LoginRoutePageComponent {}
