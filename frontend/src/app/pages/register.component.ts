import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { errMsg } from '../models';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(0|\+84)\d{9}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-box">
      <h2>ĐĂNG KÝ TÀI KHOẢN</h2>

      <label>Email đăng ký</label>
      <input type="email" [(ngModel)]="email" placeholder="Nhập email để đăng ký" autocomplete="email">
      @if (err()['email']) { <small class="field-err">{{ err()['email'] }}</small> }

      <label>Họ và tên</label>
      <input type="text" [(ngModel)]="fullName" placeholder="Nhập tên đăng ký" autocomplete="name">
      @if (err()['fullName']) { <small class="field-err">{{ err()['fullName'] }}</small> }

      <label>Số điện thoại</label>
      <input type="tel" [(ngModel)]="phone" placeholder="Nhập số điện thoại" autocomplete="tel">
      @if (err()['phone']) { <small class="field-err">{{ err()['phone'] }}</small> }

      <label>Mật khẩu</label>
      <input type="password" [(ngModel)]="password" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" autocomplete="new-password"
             (keyup.enter)="submit()">
      @if (err()['password']) { <small class="field-err">{{ err()['password'] }}</small> }

      @if (serverError()) { <div class="alert error">{{ serverError() }}</div> }

      <button class="btn primary block" (click)="submit()" [disabled]="busy()">
        {{ busy() ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ NGAY' }}
      </button>
      <p class="muted center">Đã có tài khoản? <a routerLink="/login">Đăng nhập</a></p>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  fullName = signal('');
  phone = signal('');
  password = signal('');
  err = signal<Record<string, string>>({});
  serverError = signal('');
  busy = signal(false);

  // Bước 3 trong sơ đồ: validate phía Frontend trước khi gọi API
  private validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (this.fullName().trim().length < 2) e['fullName'] = 'Vui lòng nhập họ tên.';
    if (!PHONE_RE.test(this.phone().replace(/\s/g, ''))) e['phone'] = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).';
    if (!EMAIL_RE.test(this.email().trim())) e['email'] = 'Email không hợp lệ.';
    if (this.password().length < 6) e['password'] = 'Mật khẩu tối thiểu 6 ký tự.';
    return e;
  }

  submit() {
    this.serverError.set('');
    const e = this.validate();
    this.err.set(e);
    if (Object.keys(e).length) return; // Bước 4: hiển thị lỗi biểu mẫu

    this.busy.set(true);
    this.auth.register({
      fullName: this.fullName().trim(),
      phone: this.phone().replace(/\s/g, ''),
      email: this.email().trim(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.busy.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigate(['/login'], { queryParams: { registered: 1, email: this.email().trim(), ...(returnUrl ? { returnUrl } : {}) } });
      },
      error: (x) => {
        this.busy.set(false);
        this.err.set(x?.error?.errors ?? {});
        this.serverError.set(errMsg(x));
      }
    });
  }
}
