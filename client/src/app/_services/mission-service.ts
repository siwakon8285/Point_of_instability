import { inject, Injectable } from '@angular/core';
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
    return params.join('&');
  }
  async add(mission: AddMission): Promise<number> {
    const url = this._api_url + '/mission-management';
    const observable = this._http.post<{ mission_id: number }>(url, mission);
    const resp = await firstValueFrom(observable);
    return resp.mission_id;
  }
}
