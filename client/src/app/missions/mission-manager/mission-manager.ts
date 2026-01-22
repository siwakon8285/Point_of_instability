import { Component, inject } from '@angular/core';
import { MissionService } from '../../_services/mission-service';
import { Mission } from '../../_models/mission';
import { AddMission } from '../../_models/add-mission';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-mission-manager',
  imports: [DatePipe, MatIconModule, MatButtonModule],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.css'
})
export class MissionManager {
  private _missionService = inject(MissionService);
  myMissions: Mission[] = [];

  async addMission(addMission: AddMission): Promise<void> {
    const id = await this._missionService.add(addMission);
    const now = new Date();
    this.myMissions.push({
      id,
      name: addMission.name,
      description: addMission.description,
      status: 'Open',
      chief_id: 0,
      crew_count: 0,
      created_at: now,
      updated_at: now
    });
  }

  openDialog(): void {
    // TODO: Implement dialog functionality
    console.log('Open dialog clicked');
  }
}
