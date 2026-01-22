import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-update-profile',
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule
    ],
    templateUrl: './update-profile.html',
    styleUrl: './update-profile.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateProfile {
    private readonly _dialogRef = inject(MatDialogRef<UpdateProfile>);
    private readonly _data = inject(MAT_DIALOG_DATA);

    displayName: string = this._data.displayName || '';

    onSubmit() {
        if (this.displayName.trim()) {
            this._dialogRef.close(this.displayName.trim());
        }
    }

    onCancel() {
        this._dialogRef.close();
    }
}
