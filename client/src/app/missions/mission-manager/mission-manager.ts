import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../_services/mission-service';
import { PassportService } from '../../_services/passport-service';
import { Mission } from '../../_models/mission';
import { AddMission } from '../../_models/add-mission';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mission-manager',
  imports: [CommonModule, DatePipe, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.css'
})
export class MissionManager {
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
  isSubmitting = signal<boolean>(false);

  // Edit Dialog state
  showEditDialog = signal<boolean>(false);
  editingMission = signal<Mission | null>(null);
  editMissionName = signal<string>('');
  editMissionDescription = signal<string>('');

  // Delete Confirmation state
  showDeleteConfirm = signal<boolean>(false);
  deletingMission = signal<Mission | null>(null);

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

  constructor() {
    // No manual load needed as it's now reactive
  }

  // Create Mission Dialog
  openDialog(): void {
    this.showDialog.set(true);
    this.newMissionName.set('');
    this.newMissionDescription.set('');
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.newMissionName.set('');
    this.newMissionDescription.set('');
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
      const addMission: AddMission = { name, description };
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
    this.showEditDialog.set(true);
  }

  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.editingMission.set(null);
    this.editMissionName.set('');
    this.editMissionDescription.set('');
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
      await this._missionService.edit(mission.id, { name, description });
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
}
