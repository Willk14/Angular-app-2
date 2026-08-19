import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { RegisterPageComponent } from './pages/register/register-page.component';
import { LoginRoutePageComponent } from './pages/login/login-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ProductsPageComponent } from './pages/products/products-page.component';
import { CartPageComponent } from './pages/cart/cart-page.component';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { InventoryPageComponent } from './pages/inventory/inventory-page.component';
import { CounterPageComponent } from './pages/counter/counter-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';
import { ContactPageComponent } from './pages/contact/contact-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'login', component: LoginRoutePageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'products', component: ProductsPageComponent },
  { path: 'cart', component: CartPageComponent },
  { path: 'profile', component: ProfilePageComponent },
  { path: 'inventory', component: InventoryPageComponent },
  { path: 'counter', component: CounterPageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: '**', redirectTo: '' }
];
