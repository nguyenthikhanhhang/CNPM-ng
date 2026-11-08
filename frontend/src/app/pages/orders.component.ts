import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Order, STATUS_LABEL, errMsg } from '../models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="container narrow">
      <h2>Đơn hàng của tôi</h2>
      @if (error()) { <div class="alert error">{{ error() }}</div> }
      @if (!loading() && !orders().length && !error()) {
        <p class="muted">Bạn chưa có đơn hàng nào. <a routerLink="/">Mua sắm ngay</a></p>
      }
      @for (o of orders(); track o.id) {
        <div class="panel">
          <div class="line"><b>Đơn #{{ o.id }}</b><span class="status s-{{ o.status }}">{{ label[o.status] }}</span></div>
          <div class="muted">{{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }} · {{ o.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản' }}</div>
          @for (i of o.items; track i.productId) {
            <div class="line"><span>{{ i.name }} × {{ i.quantity }}</span><span>{{ i.price * i.quantity | number: '1.0-0' }} đ</span></div>
          }
          <div class="line total"><span>Tổng (gồm ship)</span><b>{{ o.total | number: '1.0-0' }} đ</b></div>
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  label = STATUS_LABEL;

  ngOnInit() {
    this.api.myOrders().subscribe({
      next: (o) => { this.orders.set(o); this.loading.set(false); },
      error: (e) => { this.error.set(errMsg(e)); this.loading.set(false); }
    });
  }
}
