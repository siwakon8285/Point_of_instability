import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mission, Brawler } from '../models';

@Injectable({
    providedIn: 'root'
})
export class MissionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/mission-viewing`;

    getMissions(): Observable<Mission[]> {
        return this.http.get<Mission[]>(`${this.apiUrl}/`);
    }

    getMissionById(id: number): Observable<Mission> {
        return this.http.get<Mission>(`${this.apiUrl}/${id}`);
    }

    getMissionCrew(id: number): Observable<Brawler[]> {
        return this.http.get<Brawler[]>(`${this.apiUrl}/${id}/crew`);
    }
}
