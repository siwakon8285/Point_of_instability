import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginModel, Passport, RegisterModel } from '../_models/passport';
import { getAvatar } from '../_helpers/avatar';

@Injectable({
  providedIn: 'root'
})
export class PassportService {
  private _storage_key = 'passport'
  private _api_url = environment.apiUrl
  private _http = inject(HttpClient)

  data = signal<Passport | undefined>(undefined)
  image = signal<string>('')

  constructor() {
    this.getPassportFromLocalStorage()
  }

  private getPassportFromLocalStorage(): void {
    const jsonStr = localStorage.getItem(this._storage_key)
    if (!jsonStr) return
    try {
      const passport: Passport = JSON.parse(jsonStr) as Passport
      this.data.set(passport)
      this.image.set(getAvatar(passport.avatar_url))
    } catch (error) {
      console.error(error)
    }
  }

  private savePassportToLocalStorage(): void {
    const passport = this.data()
    if (!passport) return
    const passportJson = JSON.stringify(passport)
    localStorage.setItem(this._storage_key, passportJson)
  }

  async login(loginData: LoginModel): Promise<string> {
    try {
      const url = this._api_url + '/authentication/login'
      const source: Observable<Passport> = this._http.post<Passport>(url, loginData)
      const passport: Passport = await firstValueFrom(source)
      this.data.set(passport)
      this.image.set(getAvatar(passport.avatar_url))
      this.savePassportToLocalStorage()
    } catch (error: any) {
      console.error(error)
      if (error.error && typeof error.error === 'string') {
        return error.error
      } else if (error.message) {
        return error.message
      } else if (error.status === 0) {
        return 'Cannot connect to server'
      }
      return 'An error occurred'
    }
    return ''
  }

  destroy(): void {
    localStorage.removeItem(this._storage_key)
    this.data.set(undefined)
    this.image.set('')
  }

  async register(registerData: RegisterModel): Promise<string> {
    try {
      const url = this._api_url + '/brawlers/register'

      const source: Observable<Passport> = this._http.post<Passport>(url, registerData)
      const passport: Passport = await firstValueFrom(source)
      this.data.set(passport)
      this.image.set(getAvatar(passport.avatar_url))

      this.savePassportToLocalStorage()
    } catch (error: any) {
      console.error(error)
      if (error.error && typeof error.error === 'string') {
        return error.error
      } else if (error.message) {
        return error.message
      } else if (error.status === 0) {
        return 'Cannot connect to server'
      }
      return 'An error occurred during registration'
    }
    return ''
  }

  saveAvatarImage(url: string): void {
    let passport = this.data()
    if (passport) {
      passport.avatar_url = url
      this.data.set(passport)
      this.image.set(getAvatar(url))
      this.savePassportToLocalStorage()
      console.log('Avatar updated:', url)
    }
  }

  updateDisplayName(displayName: string): void {
    let passport = this.data()
    if (passport) {
      passport.display_name = displayName
      this.data.set(passport)
      this.savePassportToLocalStorage()
    }
  }
}