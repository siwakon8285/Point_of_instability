import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../_services/mission-service';
import { PassportService } from '../../_services/passport-service';
import { Mission } from '../../_models/mission';
import { AddMission } from '../../_models/add-mission';
import { CrewMember } from '../../_models/crew-member';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, of, interval, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';


@Component({
  selector: 'app-mission-manager',
  imports: [CommonModule, DatePipe, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.css'
})
export class MissionManager implements OnInit, OnDestroy {
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _snackBar = inject(MatSnackBar);

  // Reactive missions signal based on global refresh trigger
  missions = toSignal(
    toObservable(this._missionService.refreshTrigger).pipe(
      switchMap(() => from(this._missionService.getMyMissions())),
      catchError(error => {
        console.error('Failed to load missions', error);
        this._snackBar.open('Failed to load your missions', 'OK', { duration: 3000 });
        return of([] as Mission[]);
      })
    ),
    { initialValue: [] as Mission[] }
  );

  // Create Dialog state
  showDialog = signal<boolean>(false);
  newMissionName = signal<string>('');
  newMissionDescription = signal<string>('');
  newMissionMaxCrew = signal<number>(3);
  newMissionDeadline = signal<string>('');
  newMissionDays = signal<number>(0);
  newMissionHours = signal<number>(0);
  newMissionMinutes = signal<number>(0);
  isSubmitting = signal<boolean>(false);

  // Edit Dialog state
  showEditDialog = signal<boolean>(false);
  editingMission = signal<Mission | null>(null);
  editMissionName = signal<string>('');
  editMissionDescription = signal<string>('');
  editMissionMaxCrew = signal<number>(3);
  editMissionDeadline = signal<string>('');
  editMissionDays = signal<number>(0);
  editMissionHours = signal<number>(0);
  editMissionMinutes = signal<number>(0);

  // Delete Confirmation state
  showDeleteConfirm = signal<boolean>(false);
  deletingMission = signal<Mission | null>(null);

  // Crew Members Dialog state
  showCrewDialog = signal<boolean>(false);
  crewDialogMission = signal<Mission | null>(null);
  crewMembers = signal<CrewMember[]>([]);
  isLoadingCrew = signal<boolean>(false);

  // Optimistic State
  hiddenJoinedMissionIds = signal<Set<number>>(new Set());

  currentUserId = computed(() => {
    const passport = this._passportService.data();
    return passport ? (passport.sub ? parseInt(passport.sub) : undefined) : undefined;
  });

  ownedMissions = computed(() => {
    const userId = this.currentUserId();
    return this.missions().filter(m => m.chief_id === userId);
  });

  joinedMissions = computed(() => {
    const userId = this.currentUserId();
    const hidden = this.hiddenJoinedMissionIds();
    return this.missions().filter(m => m.chief_id !== userId && !hidden.has(m.id));
  });

  stats = computed(() => {
    const currentMissions = this.missions();
    const userId = this.currentUserId();
    return {
      total: currentMissions.length,
      leading: currentMissions.filter(m => m.chief_id === userId).length,
      joined: currentMissions.filter(m => m.chief_id !== userId).length,
      open: currentMissions.filter(m => m.status === 'Open').length
    };
  });

  // Real-time update signal
  now = signal<Date>(new Date());

  // Countdown helper for deadline display



  getCountdown(deadlineStr: string | undefined): { text: string; isExpired: boolean; isUrgent: boolean; isFailed: boolean } {
    if (!deadlineStr) return { text: 'No deadline', isExpired: false, isUrgent: false, isFailed: false };

    const now = this.now();
    // Ensure deadline is parsed as UTC by appending 'Z' if missing and not already containing timezone info
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

  constructor() {
    setInterval(() => {
      this.now.set(new Date());
    }, 1000);
  }

  _autoRefreshSub?: Subscription;

  async ngOnInit(): Promise<void> {
    // Data loads reactively via toSignal — no auto-refresh needed
  }

  ngOnDestroy(): void {
    // cleanup if needed
  }

  // Create Mission Dialog
  openDialog(): void {
    this.showDialog.set(true);
    this.newMissionName.set('');
    this.newMissionDescription.set('');
    this.newMissionDeadline.set('');
    this.newMissionDays.set(0);
    this.newMissionHours.set(0);
    this.newMissionMinutes.set(0);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.newMissionName.set('');
    this.newMissionDescription.set('');
    this.newMissionMaxCrew.set(3);
    this.newMissionDeadline.set('');
  }

  async submitNewMission(): Promise<void> {
    const name = this.newMissionName().trim();
    const description = this.newMissionDescription().trim();

    if (!name) {
      this._snackBar.open('Please enter a mission name', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    try {
      let duration: number | undefined;
      const days = this.newMissionDays();
      const hours = this.newMissionHours();
      const minutes = this.newMissionMinutes();

      if (days > 0 || hours > 0 || minutes > 0) {
        // Calculate total duration in minutes
        duration = (days * 24 * 60) + (hours * 60) + minutes;
      }

      const addMission: AddMission = { name, description, max_crew: this.newMissionMaxCrew(), duration };
      await this._missionService.add(addMission);
      this._snackBar.open('Mission created successfully!', 'OK', { duration: 3000 });
      this.closeDialog();
      this._missionService.triggerRefresh(); // This will trigger the reactive reload
    } catch (error: any) {
      console.error('Failed to create mission', error);
      const errorMsg = error.error || error.message || 'Failed to create mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Edit Mission Dialog
  openEditDialog(mission: Mission): void {
    this.editingMission.set(mission);
    this.editMissionName.set(mission.name);
    this.editMissionDescription.set(mission.description || '');
    this.editMissionMaxCrew.set(mission.max_crew || 3);
    this.editMissionDeadline.set(mission.deadline || '');

    if (mission.duration) {
      this.editMissionDays.set(Math.floor(mission.duration / (24 * 60)));
      this.editMissionHours.set(Math.floor((mission.duration % (24 * 60)) / 60));
      this.editMissionMinutes.set(mission.duration % 60);
    } else {
      this.editMissionDays.set(0);
      this.editMissionHours.set(0);
      this.editMissionMinutes.set(0);
    }

    this.showEditDialog.set(true);
  }

  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.editingMission.set(null);
    this.editMissionName.set('');
    this.editMissionDescription.set('');
    this.editMissionMaxCrew.set(3);
    this.editMissionDeadline.set('');
    this.editMissionDays.set(0);
    this.editMissionHours.set(0);
    this.editMissionMinutes.set(0);
  }

  async submitEditMission(): Promise<void> {
    const mission = this.editingMission();
    if (!mission) return;

    const name = this.editMissionName().trim();
    const description = this.editMissionDescription().trim();

    if (!name) {
      this._snackBar.open('Please enter a mission name', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    try {
      let duration: number | undefined;
      const days = this.editMissionDays();
      const hours = this.editMissionHours();
      const minutes = this.editMissionMinutes();

      if (days > 0 || hours > 0 || minutes > 0) {
        duration = (days * 24 * 60) + (hours * 60) + minutes;
      }

      const deadline = undefined; // We are prioritizing duration approach now

      await this._missionService.edit(mission.id, {
        name,
        description,
        max_crew: this.editMissionMaxCrew(),
        deadline,
        duration
      });
      this._snackBar.open('Mission updated successfully!', 'OK', { duration: 3000 });
      this.closeEditDialog();
      this._missionService.triggerRefresh();
    } catch (error: any) {
      console.error('Failed to update mission', error);
      const errorMsg = error.error || error.message || 'Failed to update mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Delete Mission
  openDeleteConfirm(mission: Mission): void {
    this.deletingMission.set(mission);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.deletingMission.set(null);
  }

  async confirmDelete(): Promise<void> {
    const mission = this.deletingMission();
    if (!mission) return;

    this.isSubmitting.set(true);
    try {
      await this._missionService.delete(mission.id);
      this._snackBar.open('Mission deleted successfully!', 'OK', { duration: 3000 });
      this.closeDeleteConfirm();
      this._missionService.triggerRefresh();
    } catch (error: any) {
      console.error('Failed to delete mission', error);
      const errorMsg = error.error || error.message || 'Failed to delete mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Leave Mission
  async onLeave(missionId: number): Promise<void> {
    // Optimistic hide
    this.hiddenJoinedMissionIds.update(set => {
      const newSet = new Set(set);
      newSet.add(missionId);
      return newSet;
    });

    try {
      await this._missionService.leave(missionId);
      this._snackBar.open('Left mission successfully!', 'OK', { duration: 3000 });
      this._missionService.triggerRefresh();
    } catch (error: any) {
      // Rollback
      this.hiddenJoinedMissionIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(missionId);
        return newSet;
      });
      console.error('Leave error:', error);
      // Handle various error formats
      let errorMsg = 'Failed to leave mission';
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

  // Status Change Methods for Chiefs
  async startMission(missionId: number): Promise<void> {
    try {
      await this._missionService.setInProgress(missionId);
      this._snackBar.open('Mission started!', 'OK', { duration: 3000 });
      this._missionService.triggerRefresh();
    } catch (error: any) {
      const errorMsg = error.error || error.message || 'Failed to start mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  async completeMission(missionId: number): Promise<void> {
    try {
      await this._missionService.setCompleted(missionId);
      this._snackBar.open('Mission completed!', 'OK', { duration: 3000 });
      this._missionService.triggerRefresh();
    } catch (error: any) {
      const errorMsg = error.error || error.message || 'Failed to complete mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  async failMission(missionId: number): Promise<void> {
    try {
      await this._missionService.setFailed(missionId);
      this._snackBar.open('Mission marked as failed', 'OK', { duration: 3000 });
      this._missionService.triggerRefresh();
    } catch (error: any) {
      const errorMsg = error.error || error.message || 'Failed to update mission';
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
  async kickMember(member: CrewMember): Promise<void> {
    const mission = this.crewDialogMission();
    if (!mission) return;

    if (!confirm(`Are you sure you want to kick ${member.display_name}?`)) return;

    this.isLoadingCrew.set(true);
    try {
      await this._missionService.kickMember(mission.id, member.id);
      this._snackBar.open(`Kicked ${member.display_name} successfully`, 'OK', { duration: 3000 });

      // Refresh crew list locally first
      const updatedMembers = this.crewMembers().filter(m => m.id !== member.id);
      this.crewMembers.set(updatedMembers);

      // Refresh mission list to update counts
      this._missionService.triggerRefresh();
    } catch (error: any) {
      console.error('Kick error', error);
      const errorMsg = error.error || error.message || 'Failed to kick member';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    } finally {
      this.isLoadingCrew.set(false);
    }
  }
}
