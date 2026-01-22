import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PassportService } from '../_services/passport-service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const passportService = inject(PassportService);
  const passport = passportService.data();
  
  if (passport) {
    const token = passport.access_token;
    const Authorization = `Bearer ${token}`;
    req = req.clone({
      setHeaders: {
        Authorization
      }
    });
  }

  return next(req);
};