import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-server-error',
  imports: [JsonPipe, RouterLink],
  templateUrl: './server-error.html',
  styleUrl: './server-error.css'
})
export class ServerError {
  error: any;
  private _router = inject(Router);

  constructor() {
    const nav = this._router.getCurrentNavigation();
    if (nav) {
      this.error = nav.extras.state?.['error'];
    }
  }
}

