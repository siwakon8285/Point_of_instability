import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordValidator } from '../_helpers/password.validator';
import { PasswordMatchValidator } from '../_helpers/password-match.validator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PassportService } from '../_services/passport-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private _routerService = inject(Router)
  private _passportService = inject(PassportService)
  errorFromServer = ''

  mode: 'login' | 'register' = 'login'
  form: FormGroup
  errorMessage = {
    username: signal(''),
    password: signal(''),
    confirm_password: signal(''),
    display_name: signal(''),
  }

  constructor() {
    this.form = new FormGroup({
      username: new FormControl(null, [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(16)
      ]),

      password: new FormControl(null, [
        Validators.required,
        PasswordValidator(8, 10)
      ])
    })
  }

  updateErrorMessage(ctrlName: string): void {
    const control = this.form.controls[ctrlName]
    if (!control) return
    switch (ctrlName) {
      case 'username':
        if (control.hasError('required'))
          this.errorMessage.username.set('required')
        else if (control.hasError('minlength'))
          this.errorMessage.username.set('must be at least 4 characters long')
        else if (control.hasError('maxlength'))
          this.errorMessage.username.set('must be 16 characters or fewer')
        else
          this.errorMessage.username.set('')
        break

      case 'password':
        if (control.hasError('required'))
          this.errorMessage.password.set('required')
        else if (control.hasError('invalidMinLength'))
          this.errorMessage.password.set('must be at least 8 characters long')
        else if (control.hasError('invalidMaxLength'))
          this.errorMessage.password.set('must be 10 characters or fewer')
        else if (control.hasError('invalidLowerCase'))
          this.errorMessage.password.set('must contain minimum of 1 lower-case letter [a-z].')
        else if (control.hasError('invalidUpperCase'))
          this.errorMessage.password.set('must contain minimum of 1 capital letter [A-Z].')
        else if (control.hasError('invalidNumeric'))
          this.errorMessage.password.set('must contain minimum of 1 numeric character [0-9].')
        else if (control.hasError('invalidSpecialChar'))
          this.errorMessage.password.set('must contain minimum of 1 special character: !@#$%^&*(),.?":{}|<>')
        else
          this.errorMessage.password.set('')
        break

      case 'confirm_password':
        if (control.hasError('required'))
          this.errorMessage.confirm_password.set('required')
        else if (control.hasError('mismatch'))
          this.errorMessage.confirm_password.set('do not match password')
        else
          this.errorMessage.confirm_password.set('')
        break

      case 'display_name':
        if (control.hasError('required'))
          this.errorMessage.display_name.set('required')
        else
          this.errorMessage.display_name.set('')
        break
    }
  }

  toggleMode(): void {
    this.mode = this.mode === 'login' ? 'register' : 'login'
    this.updateForm()
  }

  updateForm(): void {
    if (this.mode === 'register') {
      this.form.addControl('confirm_password', new FormControl(null, [Validators.required]))
      this.form.addControl('display_name', new FormControl(null, [Validators.required]))

      this.form.addValidators(PasswordMatchValidator('password', 'confirm_password'))
    } else {
      this.form.removeControl('confirm_password')
      this.form.removeControl('display_name')

      this.form.removeValidators(PasswordMatchValidator('password', 'confirm_password'))
    }
  }

  async onSubmit(): Promise<void> {
    if (this.mode === 'login') {
      this.errorFromServer = await this._passportService.login(this.form.value)
    } else {
      this.errorFromServer = await this._passportService.register(this.form.value)
    }

    if (this.errorFromServer === '') {
      this._routerService.navigate(['/'])
    }
  }
}