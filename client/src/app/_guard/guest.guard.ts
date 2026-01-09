import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PassportService } from '../_services/passport-service';

export const guestGuard: CanActivateFn = (route, state) => {
    const passportService = inject(PassportService)
    const router = inject(Router)

    if (passportService.data()?.access_token) {
        router.navigate(['/'])
        return false
    }

    return true
}
