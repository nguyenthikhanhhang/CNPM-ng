import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { errMsg } from '../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-box">
      <h2>ĐĂNG NHẬP</h2>
      @if (info()) { <div class="alert ok">{{ info() }}</div> }
      <label>Email</label>
      <input type="email" [(ngModel)]="email" placeholder="Nhập email" autocomplete="email">
      <label>Mật khẩu</label>
      <input type="password" [(ngModel)]="password" placeholder="Nhập mật khẩu" autocomplete="current-password" (keyup.enter)="submit()">
      @if (error()) { <div class="alert error">{{ error() }}</div> }
      <button class="btn primary block" (click)="submit()" [disabled]="busy()">{{ busy() ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP' }}</button>
      <p class="muted center">Chưa có tài khoản? <a routerLink="/register">Đăng ký ngay</a></p>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  error = signal('');
  info = signal('');
  busy = signal(false);

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('registered')) this.info.set('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
    this.email.set(q.get('email') ?? '');
  }

  submit() {
    if (!this.email().trim() || !this.password()) { this.error.set('Vui lòng nhập email và mật khẩu.'); return; }
    this.error.set('');
    this.busy.set(true);
    this.auth.login(this.email().trim(), this.password()).subscribe({
      next: (res) => {
        this.busy.set(false);
        const back = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(back || this.auth.homeFor(res.user.role));
      },
      error: (e) => { this.busy.set(false); this.error.set(errMsg(e)); }
    });
  }
}
