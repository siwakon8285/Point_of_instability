import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { NavigationExtras, Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private _router = inject(Router);
  private _snackbar = inject(MatSnackBar);
  private snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
    verticalPosition: 'top',
    horizontalPosition: 'end',
    panelClass: ['error-snackbar']
  };

  handleError(error: any): Observable<never> {
    if (error) {
      switch (error.status) {
        case 400:
          const message = error.error?.message || error.error || error.message || 'Bad Request';
          this._snackbar.open(message, 'ok', this.snackBarConfig);
          break;

        case 401:
          this._snackbar.open('Invalid username or password', 'ok', this.snackBarConfig);
          break;

        case 403:
          this._router.navigate(['/server-error'], { state: { error: error.error || error.message || 'Forbidden' } });
          break;

        case 404:
          this._router.navigate(['/server-error'], { state: { error: error.error || error.message || 'Not Found' } });
          break;

        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
        case 505:
        case 506:
        case 507:
        case 508:
        case 509:
        case 510:
        case 511:
          const navExtra: NavigationExtras = {
            state: { error: error.error || error.message || 'Internal Server Error' }
          };
          this._router.navigate(['/server-error'], navExtra);
          break;
      }
    }
    return throwError(() => error);
  }
}
