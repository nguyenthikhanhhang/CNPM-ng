import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../models';

export const SHIPPING_FEE = 30000;

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>(this.read());
  open = signal(false);

  count = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  subtotal = computed(() => this.items().reduce((s, i) => s + i.product.price * i.quantity, 0));
  shipping = computed(() => (this.items().length ? SHIPPING_FEE : 0));
  total = computed(() => this.subtotal() + this.shipping());

  private read(): CartItem[] {
    try { return JSON.parse(localStorage.getItem('ody_cart') || '[]'); } catch { return []; }
  }
  private commit(items: CartItem[]) {
    this.items.set(items);
    localStorage.setItem('ody_cart', JSON.stringify(items));
  }

  add(product: Product) {
    const list = [...this.items()];
    const found = list.find((i) => i.product.id === product.id);
    if (found) {
      if (found.quantity < product.stock) found.quantity++;
    } else if (product.stock > 0) {
      list.push({ product, quantity: 1 });
    }
    this.commit(list);
    this.open.set(true);
  }
  setQty(id: number, qty: number) {
    const list = this.items()
      .map((i) => (i.product.id === id ? { ...i, quantity: Math.min(qty, i.product.stock) } : i))
      .filter((i) => i.quantity > 0);
    this.commit(list);
  }
  remove(id: number) { this.commit(this.items().filter((i) => i.product.id !== id)); }
  clear() { this.commit([]); }
}
