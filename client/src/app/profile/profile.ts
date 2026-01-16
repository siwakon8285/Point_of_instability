import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { getAvatar } from '../_helpers/avatar';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  private _passport = inject(PassportService);
  private _router = inject(Router);

  displayName = computed(() => this._passport.data()?.display_name ?? 'Guest');
  avatarUrl = computed(() => getAvatar(this._passport.data()?.avatar_url));

  logout(): void {
    this._passport.destroy();
    this._router.navigate(['/']);
  }
}
