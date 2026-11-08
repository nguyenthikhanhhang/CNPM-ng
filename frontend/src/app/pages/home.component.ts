import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models';
import { errMsg } from '../models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section class="hero">
      <span class="tag">COLLECTION 2026</span>
      <h1>ODYSSEY MENSWEAR</h1>
      <p>Phong cách thời trang nam hiện đại, tối giản &amp; đẳng cấp</p>
    </section>

    <section class="container">
      <div class="chips">
        @for (c of categories(); track c) {
          <button [class.active]="selected() === c" (click)="selected.set(c)">{{ c }}</button>
        }
      </div>

      @if (error()) { <div class="alert error">{{ error() }}</div> }
      @if (loading()) { <p class="muted center">Đang tải sản phẩm...</p> }

      <div class="grid">
        @for (p of filtered(); track p.id) {
          <article class="card">
            <div class="img"><img [src]="p.image" [alt]="p.name"><span class="badge">{{ p.category }}</span></div>
            <div class="body">
              <h3>{{ p.name }}</h3>
              <div class="price">{{ p.price | number: '1.0-0' }} đ</div>
              @if (p.stock > 0) {
                <button class="btn primary block" (click)="cart.add(p)">+ Thêm vào giỏ</button>
              } @else {
                <button class="btn block" disabled>Hết hàng</button>
              }
            </div>
          </article>
        }
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  cart = inject(CartService);

  products = signal<Product[]>([]);
  selected = signal('Tất cả');
  loading = signal(true);
  error = signal('');

  categories = computed(() => ['Tất cả', ...new Set(this.products().map((p) => p.category))]);
  filtered = computed(() =>
    this.selected() === 'Tất cả' ? this.products() : this.products().filter((p) => p.category === this.selected())
  );

  ngOnInit() {
    this.api.products().subscribe({
      next: (list) => { this.products.set(list); this.loading.set(false); },
      error: (e) => { this.error.set(errMsg(e)); this.loading.set(false); }
    });
  }
}
