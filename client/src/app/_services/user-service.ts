import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PassportService } from './passport-service';
import { CloudinaryImage } from '../_models/cloudinary-image';
import { fileToBase64 } from '../_helpers/file';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _api_url = environment.apiUrl
  private _http = inject(HttpClient)
  private _passportService = inject(PassportService)

  async uploadAvatarImage(file: File): Promise<boolean> {
    const url = this._api_url + '/brawlers/avatar'
    const base64_string = await fileToBase64(file)

    const uploadData = {
      "base64_string": base64_string.split(',')[1] // ตัด mimetype ออก
    }

    console.log('Uploading to:', url)
    console.log('Upload data size:', uploadData.base64_string.length)

    try {
      const cloud_image = await firstValueFrom(this._http.post<CloudinaryImage>(url, uploadData))
      console.log('Upload response:', cloud_image)
      this._passportService.saveAvatarImage(cloud_image.url)
      return true
    } catch (error) {
      console.error('Upload failed:', error)
      return false
    }
  }

  async updateProfile(displayName: string): Promise<boolean> {
    const url = this._api_url + '/brawlers/update'
    const updateData = {
      "display_name": displayName
    }

    try {
      await firstValueFrom(this._http.put(url, updateData))
      this._passportService.updateDisplayName(displayName)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
