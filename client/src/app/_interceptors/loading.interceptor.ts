import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, finalize } from 'rxjs';
import { Loading } from '../_services/loading';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(Loading);
  loadingService.loading();
  return next(req).pipe(
    // delay(2000), // for testing
    finalize(() => loadingService.idle())
  );
};
