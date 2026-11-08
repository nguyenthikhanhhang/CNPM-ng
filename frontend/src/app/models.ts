export type Role = 'customer' | 'staff' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';

export interface User { id: number; fullName: string; email: string; phone: string; role: Role; }
export interface AuthResponse { token: string; user: User; message?: string; }
export interface Product { id: number; name: string; category: string; price: number; stock: number; image: string | null; isActive: boolean; }
export interface CartItem { product: Product; quantity: number; }
export interface OrderItem { productId: number; name: string; price: number; quantity: number; }
export interface Order {
  id: number; customerName: string; phone: string; address: string; paymentMethod: 'COD' | 'BANK';
  status: OrderStatus; subtotal: number; shippingFee: number; total: number; createdAt: string; items: OrderItem[];
}
export interface Report {
  totals: { revenue: number; orders: number; customers: number; staff: number; products: number };
  daily: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  byCategory: { category: string; revenue: number }[];
  byStatus: { status: OrderStatus; n: number }[];
  lowStock: { id: number; name: string; stock: number }[];
}
export interface StaffMember { id: number; fullName: string; email: string; phone: string; createdAt: string; }

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy'
};
export const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

// Lấy thông báo lỗi từ backend; nếu không gọi được API thì gợi ý kiểm tra backend/database
export function errMsg(e: any): string {
  return e?.error?.message || 'Không kết nối được máy chủ. Hãy kiểm tra backend (cổng 3000) và database.';
}
