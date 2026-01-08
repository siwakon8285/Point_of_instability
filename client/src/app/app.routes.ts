import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { ServerError } from './server-error/server-error';
import { NotFound } from './not-found/not-found';
import { MissionList } from './mission-list/mission-list';

export const routes: Routes = [
    { path: '', component: NotFound },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'profile', component: Profile },
    { path: 'server-error', component: ServerError },
    { path: '**', component: NotFound },
]
