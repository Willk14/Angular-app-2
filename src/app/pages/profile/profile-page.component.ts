import { Component } from '@angular/core';
import { UserProfileEditorComponent } from '../../features/user-profile-editor/user-profile-editor.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [UserProfileEditorComponent],
  template: `
    <section class="page-shell">
      <app-user-profile-editor />
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.page-shell { max-width: 900px; margin: 0 auto; }`
  ]
})
export class ProfilePageComponent {}
