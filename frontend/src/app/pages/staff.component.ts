import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Order, OrderStatus, Product, STATUSES, STATUS_LABEL, errMsg } from '../models';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="container">
      <h2>Khu vực nhân viên</h2>
      <div class="tabs">
        <button [class.active]="tab() === 'products'" (click)="tab.set('products')">Sản phẩm</button>
        <button [class.active]="tab() === 'orders'" (click)="tab.set('orders')">Đơn hàng</button>
      </div>
      @if (msg()) { <div class="alert ok">{{ msg() }}</div> }
      @if (error()) { <div class="alert error">{{ error() }}</div> }

      @if (tab() === 'products') {
        <div class="panel">
          <h3>{{ editingId() ? 'Sửa sản phẩm #' + editingId() : 'Thêm sản phẩm mới' }}</h3>
          <div class="form-grid">
            <div><label>Tên sản phẩm</label><input [(ngModel)]="name"></div>
            <div><label>Danh mục</label>
              <input [(ngModel)]="category" list="cats" placeholder="Áo Sơ Mi, Quần Jeans...">
              <datalist id="cats">@for (c of cats(); track c) { <option [value]="c"></option> }</datalist></div>
            <div><label>Giá (đ)</label><input type="number" min="0" [(ngModel)]="price"></div>
            <div><label>Tồn kho</label><input type="number" min="0" [(ngModel)]="stock"></div>
            <div class="wide"><label>Link ảnh sản phẩm</label><input [(ngModel)]="image" placeholder="https://..."></div>
          </div>
          <div class="row">
            <button class="btn primary" (click)="saveProduct()">{{ editingId() ? 'Lưu thay đổi' : '+ Thêm sản phẩm' }}</button>
            @if (editingId()) { <button class="btn" (click)="resetForm()">Hủy sửa</button> }
          </div>
        </div>

        <div class="panel scroll">
          <table>
            <thead><tr><th>Ảnh</th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Kho</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              @for (p of products(); track p.id) {
                <tr [class.dim]="!p.isActive">
                  <td><img class="thumb" [src]="p.image" [alt]="p.name"></td>
                  <td>{{ p.name }}</td><td>{{ p.category }}</td>
                  <td>{{ p.price | number: '1.0-0' }} đ</td><td>{{ p.stock }}</td>
                  <td>{{ p.isActive ? 'Đang bán' : 'Đã ẩn' }}</td>
                  <td class="nowrap">
                    <button class="btn small" (click)="edit(p)">Sửa</button>
                    @if (p.isActive) { <button class="btn small danger" (click)="hide(p)">Ẩn</button> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (tab() === 'orders') {
        <div class="panel scroll">
          <table>
            <thead><tr><th>Mã</th><th>Ngày</th><th>Khách</th><th>SĐT</th><th>Sản phẩm</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
            <tbody>
              @for (o of orders(); track o.id) {
                <tr>
                  <td>#{{ o.id }}</td><td>{{ o.createdAt | date: 'dd/MM HH:mm' }}</td>
                  <td>{{ o.customerName }}<div class="muted small-text">{{ o.address }}</div></td><td>{{ o.phone }}</td>
                  <td>@for (i of o.items; track i.productId) { <div>{{ i.name }} × {{ i.quantity }}</div> }</td>
                  <td>{{ o.total | number: '1.0-0' }} đ</td>
                  <td>
                    <select [ngModel]="o.status" (ngModelChange)="changeStatus(o, $event)">
                      @for (s of statuses; track s) { <option [value]="s">{{ label[s] }}</option> }
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!orders().length) { <p class="muted center">Chưa có đơn hàng.</p> }
        </div>
      }
    </div>
  `
})
export class StaffComponent implements OnInit {
  private api = inject(ApiService);
  tab = signal<'products' | 'orders'>('products');
  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  msg = signal('');
  error = signal('');
  statuses = STATUSES;
  label = STATUS_LABEL;

  editingId = signal<number | null>(null);
  name = signal(''); category = signal(''); price = signal(0); stock = signal(0); image = signal('');

  cats = () => [...new Set(this.products().map((p) => p.category))];

  ngOnInit() { this.load(); }

  load() {
    this.api.allProducts().subscribe({ next: (p) => this.products.set(p), error: (e) => this.error.set(errMsg(e)) });
    this.api.allOrders().subscribe({ next: (o) => this.orders.set(o), error: (e) => this.error.set(errMsg(e)) });
  }

  private flash(text: string) { this.error.set(''); this.msg.set(text); setTimeout(() => this.msg.set(''), 3000); }

  resetForm() {
    this.editingId.set(null);
    this.name.set(''); this.category.set(''); this.price.set(0); this.stock.set(0); this.image.set('');
  }

  edit(p: Product) {
    this.editingId.set(p.id);
    this.name.set(p.name); this.category.set(p.category); this.price.set(p.price);
    this.stock.set(p.stock); this.image.set(p.image ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveProduct() {
    const body = { name: this.name(), category: this.category(), price: Number(this.price()), stock: Number(this.stock()), image: this.image() };
    const id = this.editingId();
    const req = id ? this.api.updateProduct(id, { ...body, isActive: true }) : this.api.addProduct(body);
    req.subscribe({
      next: () => { this.flash(id ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm mới.'); this.resetForm(); this.load(); },
      error: (e) => { this.msg.set(''); this.error.set(errMsg(e)); }
    });
  }

  hide(p: Product) {
    if (!confirm(`Ẩn sản phẩm "${p.name}" khỏi cửa hàng?`)) return;
    this.api.hideProduct(p.id).subscribe({ next: () => { this.flash('Đã ẩn sản phẩm.'); this.load(); }, error: (e) => this.error.set(errMsg(e)) });
  }

  changeStatus(o: Order, status: OrderStatus) {
    this.api.setStatus(o.id, status).subscribe({
      next: () => this.flash(`Đã cập nhật đơn #${o.id}.`),
      error: (e) => { this.error.set(errMsg(e)); this.load(); }
    });
  }
}
