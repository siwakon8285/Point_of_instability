import { Component, computed, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { getAvatar } from '../_helpers/avatar';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UploadPhoto } from '../_dialog/upload-photo/upload-photo';
import { UpdateProfile } from '../_dialog/update-profile/update-profile';
import { UserService } from '../_services/user-service';

@Component({
  selector: 'app-profile',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  private _passport = inject(PassportService);
  private _router = inject(Router);
  private _dialog = inject(MatDialog);
  private _userService = inject(UserService);
  private _cdr = inject(ChangeDetectorRef);
  private _snackBar = inject(MatSnackBar);

  displayName = computed(() => this._passport.data()?.display_name ?? 'Guest');
  avatarUrl = computed(() => {
    const url = this._passport.image();
    console.log('Avatar URL computed:', url);
    // Add cache-busting timestamp to force image refresh
    if (url && url !== '/assets/unnamed.jpg') {
      return `${url}?t=${Date.now()}`;
    }
    return url;
  });

  logout(): void {
    this._passport.destroy();
    this._router.navigate(['/']);
  }

  openDialog(): void {
    const ref = this._dialog.open(UploadPhoto);
    ref.afterClosed().subscribe(async (file) => {
      if (file) {
        console.log('Uploading file:', file.name);
        const success = await this._userService.uploadAvatarImage(file);
        console.log('Upload success:', success);

        if (success) {
          this._snackBar.open('อัปโหลดรูปโปรไฟล์สำเร็จ!', 'ปิด', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        } else {
          this._snackBar.open('อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่', 'ปิด', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }

        // Force change detection to ensure the UI updates
        this._cdr.detectChanges();
      }
    });
  }

  editProfile(): void {
    this._router.navigate(['/']);
  }
}
