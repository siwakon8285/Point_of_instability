import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { ServerError } from './server-error/server-error';
import { NotFound } from './not-found/not-found';
import { Missions } from './missions/missions';
import { MissionManager } from './missions/mission-manager/mission-manager';
import { authGuard } from './_guard/auth.guard';
import { guestGuard } from './_guard/guest.guard';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'home', component: Home },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'profile', component: Profile, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'missions', component: Missions, canActivate: [authGuard] },
    { path: 'chief', component: MissionManager, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'server-error', component: ServerError },
    { path: '**', component: NotFound }
];
