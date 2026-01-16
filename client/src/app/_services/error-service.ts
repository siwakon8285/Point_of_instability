import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NavigationExtras, Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { MatSnackBarConfig } from '@angular/material/snack-bar';

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
          if (error.error) {
            this._snackbar.open("invalid username or password", 'ok', this.snackBarConfig);
          } else {
            this._snackbar.open('bad request', 'ok', this.snackBarConfig);
          }

          if (error.error.errors) {
            this._snackbar.open(error.error.errors, 'ok', this.snackBarConfig);
          }
          break;
        case 404:
          this._router.navigate(['/not-found']);
          break;
        case 401:
          this._snackbar.open('invalid username or password', 'ok', this.snackBarConfig);
          break;
        case 500:
          this._router.navigate(['/server-error']);
          break;
        case 501:
          this._router.navigate(['/server-error']);
          break;
        case 502:
          this._router.navigate(['/server-error']);
          break;
        case 503:
          this._router.navigate(['/server-error']);
          break;
        case 504:
          this._router.navigate(['/server-error']);
          break;
        case 505:
          this._router.navigate(['/server-error']);
          break;
        case 506:
          this._router.navigate(['/server-error']);
          break;
        case 507:
          this._router.navigate(['/server-error']);
          break;
        case 508:
          this._router.navigate(['/server-error']);
          break;
        case 509:
          this._router.navigate(['/server-error']);
          break;
        case 510:
          this._router.navigate(['/server-error']);
          break;
        case 511:
          const navExtra: NavigationExtras = {
            state: {
              error: error.error,
            },
          };
          this._router.navigate(['/server-error'], navExtra);
          break;
        default:
          this._snackbar.open(
            'some thing went wrong >_<))) pls try againg later ><',
            'ok',
            this.snackBarConfig
          );
          break;
      }
    }
    return throwError(() => error);
  }
}
