import { Component } from '@angular/core';
import { HomeComponent } from './home.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HomeComponent],
  template: `<app-home-component />`
})
export class HomePageComponent {}
