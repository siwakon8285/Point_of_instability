import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mission } from '../_models/mission';

export interface DashboardStats {
    total_missions: number;
    total_brawlers: number;
    open_missions: number;
    active_missions: number;
}

export interface UserDashboardStats {
    my_missions_count: number;
    joined_missions_count: number;
    success_count: number;
    total_participated: number;
}

export interface UserDashboard {
    stats: UserDashboardStats;
    active_missions: Mission[];
    open_missions: Mission[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private _api_url = environment.apiUrl;
    private _http = inject(HttpClient);

    async getStats(): Promise<DashboardStats> {
        const url = this._api_url + '/dashboard/stats';
        const observable = this._http.get<DashboardStats>(url);
        return firstValueFrom(observable);
    }

    async getRecentMissions(): Promise<Mission[]> {
        const url = this._api_url + '/dashboard/recent-missions';
        const observable = this._http.get<Mission[]>(url);
        return firstValueFrom(observable);
    }

    async getUserDashboard(): Promise<UserDashboard> {
        const url = this._api_url + '/dashboard/me';
        const observable = this._http.get<UserDashboard>(url);
        return firstValueFrom(observable);
    }
}
