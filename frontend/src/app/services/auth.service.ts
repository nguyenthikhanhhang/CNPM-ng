import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API } from '../config';
import { AuthResponse, User } from '../models';

export interface RegisterBody { fullName: string; phone: string; email: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<User | null>(this.read());
  isLoggedIn = computed(() => !!this.user());
  isStaff = computed(() => ['staff', 'admin'].includes(this.user()?.role ?? ''));
  isAdmin = computed(() => this.user()?.role === 'admin');

  private read(): User | null {
    try { return JSON.parse(localStorage.getItem('ody_user') || 'null'); } catch { return null; }
  }
  private save(res: AuthResponse) {
    localStorage.setItem('ody_token', res.token);
    localStorage.setItem('ody_user', JSON.stringify(res.user));
    this.user.set(res.user);
  }

  register(body: RegisterBody) {
    // Đăng ký xong KHÔNG tự đăng nhập: người dùng phải sang trang Đăng nhập
    return this.http.post<{ message: string; user: User }>(`${API}/auth/register`, body);
  }
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/auth/login`, { email, password }).pipe(tap((r) => this.save(r)));
  }
  logout() {
    localStorage.removeItem('ody_token');
    localStorage.removeItem('ody_user');
    this.user.set(null);
    this.router.navigateByUrl('/');
  }
  homeFor(role: string): string {
    return role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/';
  }
}
