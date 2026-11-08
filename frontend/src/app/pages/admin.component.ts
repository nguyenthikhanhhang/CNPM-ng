import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Report, STATUS_LABEL, StaffMember, errMsg } from '../models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="container">
      <div class="row between">
        <h2>Báo cáo &amp; quản trị</h2>
        <select [ngModel]="days()" (ngModelChange)="setDays($event)">
          <option [ngValue]="7">7 ngày qua</option>
          <option [ngValue]="30">30 ngày qua</option>
          <option [ngValue]="90">90 ngày qua</option>
        </select>
      </div>
      @if (error()) { <div class="alert error">{{ error() }}</div> }

      @if (report(); as r) {
        <div class="stats">
          <div class="stat"><span>Tổng doanh thu</span><b>{{ r.totals.revenue | number: '1.0-0' }} đ</b></div>
          <div class="stat"><span>Đơn hàng</span><b>{{ r.totals.orders }}</b></div>
          <div class="stat"><span>Khách hàng</span><b>{{ r.totals.customers }}</b></div>
          <div class="stat"><span>Nhân viên</span><b>{{ r.totals.staff }}</b></div>
          <div class="stat"><span>Sản phẩm đang bán</span><b>{{ r.totals.products }}</b></div>
        </div>

        <div class="panel">
          <h3>Doanh thu theo ngày</h3>
          @if (!bars().length) { <p class="muted">Chưa có đơn hàng trong khoảng thời gian này.</p> }
          @else {
            <div class="scroll">
              <svg [attr.viewBox]="'0 0 ' + chartW() + ' 220'" [style.min-width.px]="chartW()" class="chart">
                @for (b of bars(); track b.day) {
                  <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="3" class="bar"></rect>
                  <text [attr.x]="b.x + b.w / 2" [attr.y]="b.y - 5" text-anchor="middle" class="bar-val">{{ b.short }}</text>
                  <text [attr.x]="b.x + b.w / 2" y="205" text-anchor="middle" class="bar-lbl">{{ b.label }}</text>
                }
              </svg>
            </div>
          }
        </div>

        <div class="two-col">
          <div class="panel">
            <h3>Top 5 sản phẩm bán chạy</h3>
            <table><thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th></tr></thead><tbody>
              @for (t of r.topProducts; track t.name) {
                <tr><td>{{ t.name }}</td><td>{{ t.sold }}</td><td>{{ t.revenue | number: '1.0-0' }} đ</td></tr>
              }
            </tbody></table>
          </div>
          <div class="panel">
            <h3>Doanh thu theo danh mục</h3>
            @for (c of r.byCategory; track c.category) {
              <div class="meter"><span>{{ c.category }}</span>
                <div class="track"><div class="fill" [style.width.%]="catPct(c.revenue)"></div></div>
                <b>{{ c.revenue | number: '1.0-0' }} đ</b></div>
            }
          </div>
        </div>

        <div class="two-col">
          <div class="panel">
            <h3>Đơn theo trạng thái</h3>
            @for (s of r.byStatus; track s.status) {
              <div class="line"><span class="status s-{{ s.status }}">{{ label[s.status] }}</span><b>{{ s.n }}</b></div>
            }
          </div>
          <div class="panel">
            <h3>Sắp hết hàng (≤ 5)</h3>
            @for (l of r.lowStock; track l.id) { <div class="line"><span>{{ l.name }}</span><b>{{ l.stock }}</b></div> }
            @if (!r.lowStock.length) { <p class="muted">Tồn kho ổn định.</p> }
          </div>
        </div>
      }

      <div class="panel">
        <h3>Cấp tài khoản nhân viên</h3>
        <div class="form-grid">
          <div><label>Họ tên</label><input [(ngModel)]="sName"></div>
          <div><label>Email</label><input [(ngModel)]="sEmail"></div>
          <div><label>Số điện thoại</label><input [(ngModel)]="sPhone"></div>
          <div><label>Mật khẩu</label><input type="password" [(ngModel)]="sPass"></div>
        </div>
        @if (msg()) { <div class="alert ok">{{ msg() }}</div> }
        <button class="btn primary" (click)="addStaff()">+ Tạo nhân viên</button>
        <table class="mt">
          <thead><tr><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Ngày tạo</th></tr></thead>
          <tbody>@for (s of staff(); track s.id) {
            <tr><td>{{ s.fullName }}</td><td>{{ s.email }}</td><td>{{ s.phone }}</td><td>{{ s.createdAt | date: 'dd/MM/yyyy' }}</td></tr>
          }</tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  report = signal<Report | null>(null);
  staff = signal<StaffMember[]>([]);
  days = signal(30);
  error = signal('');
  msg = signal('');
  label = STATUS_LABEL;

  sName = signal(''); sEmail = signal(''); sPhone = signal(''); sPass = signal('');

  private barW = 46;
  chartW = computed(() => Math.max(600, (this.report()?.daily.length ?? 0) * (this.barW + 10) + 20));
  bars = computed(() => {
    const d = this.report()?.daily ?? [];
    const max = Math.max(1, ...d.map((x) => x.revenue));
    return d.map((x, i) => {
      const h = Math.max(3, (x.revenue / max) * 150);
      return {
        day: x.day, x: 10 + i * (this.barW + 10), w: this.barW, h, y: 185 - h,
        label: x.day.slice(5).replace('-', '/'),
        short: x.revenue >= 1e6 ? (x.revenue / 1e6).toFixed(1) + 'tr' : Math.round(x.revenue / 1000) + 'k'
      };
    });
  });

  catPct(v: number) {
    const max = Math.max(1, ...(this.report()?.byCategory.map((c) => c.revenue) ?? [1]));
    return (v / max) * 100;
  }

  ngOnInit() { this.load(); this.loadStaff(); }
  setDays(n: number) { this.days.set(n); this.load(); }

  load() {
    this.api.report(this.days()).subscribe({
      next: (r) => { this.report.set(r); this.error.set(''); },
      error: (e) => this.error.set(errMsg(e))
    });
  }
  loadStaff() { this.api.staff().subscribe({ next: (s) => this.staff.set(s), error: (e) => this.error.set(errMsg(e)) }); }

  addStaff() {
    this.api.addStaff({ fullName: this.sName(), email: this.sEmail(), phone: this.sPhone(), password: this.sPass() }).subscribe({
      next: () => {
        this.msg.set('Đã tạo tài khoản nhân viên.'); this.error.set('');
        this.sName.set(''); this.sEmail.set(''); this.sPhone.set(''); this.sPass.set('');
        this.loadStaff(); this.load();
      },
      error: (e) => { this.msg.set(''); this.error.set(errMsg(e)); }
    });
  }
}
