import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API } from '../config';
import { Order, OrderStatus, Product, Report, StaffMember } from '../models';

export interface ProductBody { name: string; category: string; price: number; stock: number; image: string; isActive?: boolean; }
export interface OrderBody {
  name: string; phone: string; address: string; paymentMethod: 'COD' | 'BANK';
  items: { productId: number; quantity: number }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  products() { return this.http.get<Product[]>(`${API}/products`); }
  allProducts() { return this.http.get<Product[]>(`${API}/products/manage`); }
  addProduct(b: ProductBody) { return this.http.post(`${API}/products`, b); }
  updateProduct(id: number, b: ProductBody) { return this.http.put(`${API}/products/${id}`, b); }
  hideProduct(id: number) { return this.http.delete(`${API}/products/${id}`); }

  createOrder(b: OrderBody) { return this.http.post<{ id: number; total: number }>(`${API}/orders`, b); }
  myOrders() { return this.http.get<Order[]>(`${API}/orders/mine`); }
  allOrders() { return this.http.get<Order[]>(`${API}/orders`); }
  setStatus(id: number, status: OrderStatus) { return this.http.patch(`${API}/orders/${id}/status`, { status }); }

  report(days: number) { return this.http.get<Report>(`${API}/admin/report`, { params: { days } }); }
  staff() { return this.http.get<StaffMember[]>(`${API}/admin/staff`); }
  addStaff(b: { fullName: string; email: string; phone: string; password: string }) {
    return this.http.post(`${API}/admin/staff`, b);
  }
}
