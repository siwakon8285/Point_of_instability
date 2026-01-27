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

  missions = signal<Mission[]>([]);

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
    return this.missions().filter(m => m.chief_id !== userId);
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
    this.loadMyMission();
  }

  private async loadMyMission() {
    try {
      const missions = await this._missionService.getMyMissions();
      this.missions.set(missions);
    } catch (error) {
      console.error('Failed to load missions', error);
      this._snackBar.open('Failed to load your missions', 'OK', { duration: 3000 });
    }
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
      await this.loadMyMission();
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
      await this.loadMyMission();
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
      await this.loadMyMission();
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
    try {
      await this._missionService.leave(missionId);
      this._snackBar.open('Left mission successfully!', 'OK', { duration: 3000 });
      await this.loadMyMission();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.error || error.message || 'Failed to leave mission';
      this._snackBar.open(errorMsg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }
}
