import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">
        <img src="logo.png" class="school-logo" alt="Logo trường">
        <span>ODYSSEY</span>
      </a>
      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
        @if (auth.isLoggedIn()) { <a routerLink="/orders" routerLinkActive="active">Đơn hàng của tôi</a> }
        @if (auth.isStaff()) { <a routerLink="/staff" routerLinkActive="active">Nhân viên</a> }
        @if (auth.isAdmin()) { <a routerLink="/admin" routerLinkActive="active">Quản trị</a> }
      </nav>
      <div class="actions">
        <button class="btn ghost" (click)="cart.open.set(true)">🛒 Giỏ hàng ({{ cart.count() }})</button>
        @if (auth.user(); as u) {
          <span class="hello">Xin chào, <b>{{ u.fullName }}</b></span>
          <button class="btn ghost" (click)="auth.logout()">Đăng xuất</button>
        } @else {
          <a routerLink="/login" class="btn ghost">Đăng nhập</a>
          <a routerLink="/register" class="btn primary">Đăng ký</a>
        }
      </div>
    </header>

    <main class="page"><router-outlet></router-outlet></main>

    @if (cart.open()) {
      <div class="overlay" (click)="cart.open.set(false)"></div>
      <aside class="drawer">
        <div class="drawer-head">
          <h3>Giỏ hàng</h3>
          <button class="icon-btn" (click)="cart.open.set(false)">✕</button>
        </div>
        @if (!cart.items().length) {
          <p class="muted center">Giỏ hàng đang trống.</p>
        }
        <div class="drawer-body">
          @for (it of cart.items(); track it.product.id) {
            <div class="cart-row">
              <img [src]="it.product.image" [alt]="it.product.name">
              <div class="grow">
                <div class="name">{{ it.product.name }}</div>
                <div class="muted">{{ it.product.price | number: '1.0-0' }} đ</div>
                <div class="qty">
                  <button (click)="cart.setQty(it.product.id, it.quantity - 1)">−</button>
                  <span>{{ it.quantity }}</span>
                  <button (click)="cart.setQty(it.product.id, it.quantity + 1)" [disabled]="it.quantity >= it.product.stock">+</button>
                </div>
              </div>
              <button class="icon-btn" (click)="cart.remove(it.product.id)" title="Xóa">🗑</button>
            </div>
          }
        </div>
        @if (cart.items().length) {
          <div class="drawer-foot">
            <div class="line"><span>Tạm tính</span><b>{{ cart.subtotal() | number: '1.0-0' }} đ</b></div>
            <div class="line"><span>Phí vận chuyển</span><b>{{ cart.shipping() | number: '1.0-0' }} đ</b></div>
            <div class="line total"><span>Tổng cộng</span><b>{{ cart.total() | number: '1.0-0' }} đ</b></div>
            <button class="btn primary block" (click)="goCheckout()">Thanh toán</button>
          </div>
        }
      </aside>
    }
  `
})
export class AppComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  private router = inject(Router);

  goCheckout() {
    this.cart.open.set(false);
    this.router.navigateByUrl('/checkout'); // roleGuard sẽ chuyển sang /login nếu chưa đăng nhập
  }
}
