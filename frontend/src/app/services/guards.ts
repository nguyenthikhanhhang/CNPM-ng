import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../models';

// Chỉ cho vào khi đã đăng nhập đúng vai trò; nếu không thì chuyển sang /login
export const roleGuard = (...roles: Role[]): CanActivateFn => (_route, state) => {
  const u = inject(AuthService).user();
  if (u && roles.includes(u.role)) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
