import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

interface AddMission {
  name: string;
  description?: string;
}

@Component({
  selector: 'app-new-mission',
  imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.css'
})
export class NewMission {
  addMission: AddMission = {
    name: '',
    description: ''
  };

  private readonly _dialogRef = inject(MatDialogRef<NewMission>);

  onSubmit() {
    const mission = this.clean(this.addMission);
    this._dialogRef.close(mission);
  }

  private clean(addMission: AddMission): AddMission {
    return {
      name: addMission.name.trim() || 'untitled',
      description: addMission.description?.trim() || undefined
    };
  }
}