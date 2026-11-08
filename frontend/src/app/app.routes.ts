import { Routes } from '@angular/router';
import { roleGuard } from './services/guards';
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { CheckoutComponent } from './pages/checkout.component';
import { OrdersComponent } from './pages/orders.component';
import { StaffComponent } from './pages/staff.component';
import { AdminComponent } from './pages/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [roleGuard('customer', 'staff', 'admin')] },
  { path: 'orders', component: OrdersComponent, canActivate: [roleGuard('customer', 'staff', 'admin')] },
  { path: 'staff', component: StaffComponent, canActivate: [roleGuard('staff', 'admin')] },
  { path: 'admin', component: AdminComponent, canActivate: [roleGuard('admin')] },
  { path: '**', redirectTo: '' }
];
