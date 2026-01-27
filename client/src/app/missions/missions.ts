import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, from, of } from 'rxjs';
import { catchError, debounceTime, filter, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MissionService } from '../_services/mission-service';
import { PassportService } from '../_services/passport-service';
import { Mission } from '../_models/mission';
import { MissionFilter } from '../_models/mission-filter';

@Component({
  selector: 'app-missions',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class Missions implements OnInit {
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _snackBar = inject(MatSnackBar);
  private _router = inject(Router);

  filter = signal<MissionFilter>({ status: 'Open' });
  refreshTrigger = signal<number>(0);

  isSignin = computed(() => this._passportService.isSignin());

  currentUserId = computed(() => {
    const passportData = this._passportService.data();
    if (!passportData || !passportData.sub) return undefined;
    const id = parseInt(passportData.sub, 10);
    return isNaN(id) ? undefined : id;
  });

  // Combine multiple signals into one reactive observable chain
  missions = toSignal(
    combineLatest([
      toObservable(this.filter),
      toObservable(this.currentUserId),
      toObservable(this.refreshTrigger)
    ]).pipe(
      debounceTime(100), // Prevent redundant calls
      filter(([_, userId, __]: [MissionFilter, number | undefined, number]) => {
        // Wait until userId is available before making API call
        console.log('DEBUG filter: userId =', userId);
        return userId !== undefined;
      }),
      switchMap(([activeFilter, userId, _]: [MissionFilter, number | undefined, number]) => {
        console.log('DEBUG switchMap:', { userId, activeFilter });
        const requestFilter: MissionFilter = { ...activeFilter };
        // userId is guaranteed to be defined here due to filter above
        requestFilter.exclude_owned_by = userId;
        requestFilter.exclude_joined_by = userId;
        console.log('DEBUG requestFilter:', requestFilter);
        return from(this._missionService.gets(requestFilter)).pipe(
          catchError((err: any) => {
            console.error('Failed to fetch missions', err);
            return of([] as Mission[]);
          })
        );
      })
    ),
    { initialValue: [] as Mission[] }
  );

  async ngOnInit(): Promise<void> {
    // Initial fetch handled by observable chain
  }

  updateFilter(updates: Partial<MissionFilter>): void {
    this.filter.update(f => ({ ...f, ...updates }));
  }

  onSubmit(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  async onJoin(missionId: number): Promise<void> {
    try {
      await this._missionService.join(missionId);
      this._snackBar.open('Joined mission successfully!', 'OK', { duration: 3000 });
      this._router.navigate(['/chief']);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.error || error.message || 'Failed to join mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }
}
