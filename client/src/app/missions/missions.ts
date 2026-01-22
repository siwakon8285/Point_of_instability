import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MissionService } from '../_services/mission-service';
import { Mission } from '../_models/mission';
import { MissionFilter, MissionStatus } from '../_models/mission-filter';

@Component({
  selector: 'app-missions',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class Missions {
  private _missionService = inject(MissionService);
  filter: MissionFilter = {};
  missions: Mission[] = [];

  async onSubmit(): Promise<void> {
    this.missions = [];
    try {
      this.missions = await this._missionService.gets(this.filter);
    } catch {
      this.missions = [];
    }
  }
}
