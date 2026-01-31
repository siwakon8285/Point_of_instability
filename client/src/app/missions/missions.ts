import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, from, of, interval, Subscription } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
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
import { CrewMember } from '../_models/crew-member';

@Component({
  selector: 'app-missions',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class Missions implements OnInit, OnDestroy {
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _snackBar = inject(MatSnackBar);
  private _router = inject(Router);
  private _autoRefreshSub?: Subscription;

  filter = signal<MissionFilter>({ status: 'Open' });
  hiddenMissionIds = signal<Set<number>>(new Set());

  // Crew Dialog state
  showCrewDialog = signal<boolean>(false);
  crewDialogMission = signal<Mission | null>(null);
  crewMembers = signal<CrewMember[]>([]);
  isLoadingCrew = signal<boolean>(false);

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
      toObservable(this._missionService.refreshTrigger)
    ]).pipe(
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

  filteredMissions = computed(() => {
    const hidden = this.hiddenMissionIds();
    return this.missions().filter(m => !hidden.has(m.id));
  });

  async ngOnInit(): Promise<void> {
    // Auto-refresh every 10 seconds to sync with other users' changes
    this._autoRefreshSub = interval(10000).subscribe(() => {
      this._missionService.triggerRefresh();
    });
  }

  ngOnDestroy(): void {
    this._autoRefreshSub?.unsubscribe();
  }

  updateFilter(updates: Partial<MissionFilter>): void {
    this.filter.update(f => ({ ...f, ...updates }));
  }

  onSubmit(): void {
    this._missionService.triggerRefresh();
  }

  async onJoin(missionId: number): Promise<void> {
    // Optimistic Update: Hide immediately
    this.hiddenMissionIds.update(set => {
      const newSet = new Set(set);
      newSet.add(missionId);
      return newSet;
    });

    try {
      await this._missionService.join(missionId);
      this._snackBar.open('Joined mission successfully!', 'OK', { duration: 3000 });
      this._missionService.triggerRefresh();
      this._router.navigate(['/chief']);
    } catch (error: any) {
      // Rollback on error
      this.hiddenMissionIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(missionId);
        return newSet;
      });
      console.error('Join error:', error);
      // Handle various error formats
      let errorMsg = 'Failed to join mission';
      if (typeof error?.error === 'string') {
        errorMsg = error.error;
      } else if (typeof error?.error?.message === 'string') {
        errorMsg = error.error.message;
      } else if (typeof error?.message === 'string') {
        errorMsg = error.message;
      }
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  // Crew Members Dialog
  async openCrewDialog(mission: Mission): Promise<void> {
    this.crewDialogMission.set(mission);
    this.showCrewDialog.set(true);
    this.isLoadingCrew.set(true);

    try {
      const members = await this._missionService.getCrewMembers(mission.id);
      this.crewMembers.set(members);
    } catch (error: any) {
      console.error('Failed to load crew members', error);
      this._snackBar.open('Failed to load crew members', 'OK', { duration: 3000 });
      this.crewMembers.set([]);
    } finally {
      this.isLoadingCrew.set(false);
    }
  }

  closeCrewDialog(): void {
    this.showCrewDialog.set(false);
    this.crewDialogMission.set(null);
    this.crewMembers.set([]);
  }
  // Real-time update signal
  now = signal<Date>(new Date());

  constructor() {
    setInterval(() => {
      this.now.set(new Date());
    }, 1000);
  }

  getDurationDisplay(minutes: number | undefined): string {
    if (!minutes) return 'No duration';
    const d = Math.floor(minutes / (24 * 60));
    const h = Math.floor((minutes % (24 * 60)) / 60);
    const m = minutes % 60;

    let text = '';
    if (d > 0) text += `${d}d `;
    if (h > 0) text += `${h}h `;
    text += `${m}m `;
    return text.trim();
  }

  getCountdown(deadlineStr: string | undefined): { text: string; isExpired: boolean; isUrgent: boolean; isFailed: boolean } {
    if (!deadlineStr) return { text: 'No deadline', isExpired: false, isUrgent: false, isFailed: false };

    const now = this.now();
    const safeDeadlineStr = deadlineStr.endsWith('Z') || deadlineStr.includes('+') ? deadlineStr : deadlineStr + 'Z';
    const deadline = new Date(safeDeadlineStr);
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      return { text: 'Expired', isExpired: true, isUrgent: false, isFailed: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = diff < 24 * 60 * 60 * 1000;

    let text = '';
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m `;
    if (days === 0 && hours === 0) text += `${seconds}s`;

    return { text: text.trim(), isExpired: false, isUrgent, isFailed: false };
  }
}
