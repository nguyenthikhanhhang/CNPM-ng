import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { BANK } from '../config';
import { errMsg } from '../models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="container narrow">
      <h2>Thanh toán</h2>
      @if (!cart.items().length) {
        <p class="muted">Giỏ hàng trống. <a routerLink="/">Tiếp tục mua sắm</a></p>
      } @else {
        <div class="two-col">
          <div class="panel">
            <h3>Thông tin giao hàng</h3>
            <label>Họ tên người nhận</label><input [(ngModel)]="name">
            <label>Số điện thoại</label><input [(ngModel)]="phone">
            <label>Địa chỉ</label><input [(ngModel)]="address" placeholder="Số nhà, đường, phường, quận, thành phố">
            <label>Phương thức thanh toán</label>
            <select [(ngModel)]="method">
              <option value="COD">Thanh toán khi nhận hàng (COD)</option>
              <option value="BANK">Chuyển khoản ngân hàng (VietQR)</option>
            </select>
            @if (method() === 'BANK') {
              <div class="qr">
                <img [src]="qrUrl()" alt="VietQR">
                <small class="muted">Nội dung chuyển khoản: <b>{{ transferNote }}</b></small>
              </div>
            }
          </div>

          <div class="panel">
            <h3>Đơn hàng</h3>
            @for (it of cart.items(); track it.product.id) {
              <div class="line"><span>{{ it.product.name }} × {{ it.quantity }}</span>
                <b>{{ it.product.price * it.quantity | number: '1.0-0' }} đ</b></div>
            }
            <hr>
            <div class="line"><span>Tạm tính</span><b>{{ cart.subtotal() | number: '1.0-0' }} đ</b></div>
            <div class="line"><span>Phí vận chuyển</span><b>{{ cart.shipping() | number: '1.0-0' }} đ</b></div>
            <div class="line total"><span>Tổng cộng</span><b>{{ cart.total() | number: '1.0-0' }} đ</b></div>
            @if (error()) { <div class="alert error">{{ error() }}</div> }
            <button class="btn primary block" (click)="submit()" [disabled]="busy()">
              {{ busy() ? 'ĐANG ĐẶT HÀNG...' : 'XÁC NHẬN ĐẶT HÀNG' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CheckoutComponent {
  cart = inject(CartService);
  private api = inject(ApiService);
  private router = inject(Router);
  private auth = inject(AuthService);

  name = signal(this.auth.user()?.fullName ?? '');
  phone = signal(this.auth.user()?.phone ?? '');
  address = signal('');
  method = signal<'COD' | 'BANK'>('COD');
  error = signal('');
  busy = signal(false);
  transferNote = 'ODY ' + Math.floor(100000 + Math.random() * 900000);

  qrUrl() {
    return `https://img.vietqr.io/image/${BANK.id}-${BANK.account}-compact2.png?amount=${this.cart.total()}` +
      `&addInfo=${encodeURIComponent(this.transferNote)}&accountName=${encodeURIComponent(BANK.name)}`;
  }

  submit() {
    if (!this.name().trim() || !this.phone().trim() || !this.address().trim()) {
      this.error.set('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }
    this.error.set('');
    this.busy.set(true);
    this.api.createOrder({
      name: this.name(), phone: this.phone().replace(/\s/g, ''), address: this.address(), paymentMethod: this.method(),
      items: this.cart.items().map((i) => ({ productId: i.product.id, quantity: i.quantity }))
    }).subscribe({
      next: () => { this.busy.set(false); this.cart.clear(); this.router.navigateByUrl('/orders'); },
      error: (e) => { this.busy.set(false); this.error.set(errMsg(e)); }
    });
  }
}
