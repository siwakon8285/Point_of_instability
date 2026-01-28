import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mission } from '../_models/mission';
import { MissionFilter } from '../_models/mission-filter';
import { AddMission } from '../_models/add-mission';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private _api_url = environment.apiUrl;
  private _http = inject(HttpClient);
  filter: MissionFilter = {};

  // Global trigger for refreshing mission lists across components
  refreshTrigger = signal<number>(0);

  triggerRefresh(): void {
    this.refreshTrigger.update((v: number) => v + 1);
  }

  async gets(filter: MissionFilter): Promise<Mission[]> {
    const queryString = this.toQueryString(filter);
    const url = queryString
      ? this._api_url + '/mission-viewing?' + queryString
      : this._api_url + '/mission-viewing';
    const observable = this._http.get<Mission[]>(url);
    const missions = await firstValueFrom(observable);
    return missions;
  }

  private toQueryString(filter: MissionFilter): string {
    this.filter = filter;
    const params: string[] = [];
    if (filter.name && filter.name.trim()) {
      params.push(`name=${encodeURIComponent(filter.name.trim())}`);
    }
    if (filter.status) {
      params.push(`status=${encodeURIComponent(filter.status)}`);
    }
    if (filter.exclude_owned_by !== undefined) {
      params.push(`exclude_owned_by=${filter.exclude_owned_by}`);
    }
    if (filter.exclude_joined_by !== undefined) {
      params.push(`exclude_joined_by=${filter.exclude_joined_by}`);
    }
    if (filter.owned_by !== undefined) {
      params.push(`owned_by=${filter.owned_by}`);
    }
    if (filter.joined_by !== undefined) {
      params.push(`joined_by=${filter.joined_by}`);
    }
    return params.join('&');
  }
  async add(mission: AddMission): Promise<number> {
    const url = this._api_url + '/mission-management';
    const observable = this._http.post<{ mission_id: number }>(url, mission);
    const resp = await firstValueFrom(observable);
    return resp.mission_id;
  }

  async getMyMissions(): Promise<Mission[]> {
    const url = this._api_url + '/brawlers/my-missions';
    const observable = this._http.get<Mission[]>(url);
    const missions = await firstValueFrom(observable);
    return missions;
  }

  async join(missionId: number): Promise<void> {
    const url = `${this._api_url}/crew-operation/join/${missionId}`;
    const observable = this._http.post(url, {}, { responseType: 'text' });
    await firstValueFrom(observable);
  }

  async leave(missionId: number): Promise<void> {
    const url = `${this._api_url}/crew-operation/leave/${missionId}`;
    const observable = this._http.delete(url, { responseType: 'text' });
    await firstValueFrom(observable);
  }

  async edit(missionId: number, mission: { name?: string; description?: string }): Promise<void> {
    const url = `${this._api_url}/mission-management/${missionId}`;
    const observable = this._http.patch(url, mission, { responseType: 'text' });
    await firstValueFrom(observable);
  }

  async delete(missionId: number): Promise<void> {
    const url = `${this._api_url}/mission-management/${missionId}`;
    const observable = this._http.delete(url, { responseType: 'text' });
    await firstValueFrom(observable);
  }
}
