import { Component, computed, inject, Signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { PassportService } from '../_services/passport-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterModule, MatMenuModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  encapsulation: ViewEncapsulation.None
})
export class Navbar {
  private _router = inject(Router)
  private _passportService = inject(PassportService)
  display_name: Signal<string | undefined>
  avatar_url: Signal<string>

  constructor() {
    this.display_name = computed(() => this._passportService.data()?.display_name)
    this.avatar_url = computed(() => {
      const url = this._passportService.image();
      // Add cache-busting timestamp to force image refresh
      if (url && url !== '/assets/unnamed.jpg') {
        return `${url}?t=${Date.now()}`;
      }
      return url;
    })
  }

  logout(): void {
    this._passportService.destroy()
    this._router.navigate(['/login'])
  }
}
