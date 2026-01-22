import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-upload-photo',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './upload-photo.html',
  styleUrl: './upload-photo.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadPhoto {
  acceptedImageTypes = ['image/jpeg', 'image/png'];
  imgFile: File | undefined;
  imgPreview = signal<string | undefined>(undefined);
  errorMessage = signal<string | undefined>(undefined);
  private readonly _dialogRef = inject(MatDialogRef<UploadPhoto>);

  onSubmit() {
    this._dialogRef.close(this.imgFile);
  }

  onImagePicked(event: Event) {
    this.imgPreview.set(undefined);
    this.errorMessage.set(undefined);
    this.imgFile = undefined;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // ใช้ file.type แทน file-type library
      if (this.acceptedImageTypes.includes(file.type)) {
        this.imgFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.imgPreview.set(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.imgFile = undefined;
        this.errorMessage.set('Image file must be .jpeg, or .png');
      }
    }
  }
}
