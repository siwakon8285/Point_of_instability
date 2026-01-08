import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MissionService } from '../services/mission.service';
import { Mission } from '../models';

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mission-container">
      <header class="header">
        <h1>Active Missions</h1>
        <p>Real-time field operation data from point of instability.</p>
      </header>

      <div class="mission-grid">
        <div *ngFor="let mission of missions" class="mission-card" [class]="mission.status.toLowerCase()">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="status-badge">{{ mission.status }}</div>
            <h3>{{ mission.name }}</h3>
            <p class="description">{{ mission.description || 'No description provided.' }}</p>
            
            <div class="card-footer">
              <div class="stat">
                <span class="label">CREW</span>
                <span class="value">{{ mission.crew_count }}</span>
              </div>
              <div class="stat">
                <span class="label">CREATED</span>
                <span class="value">{{ mission.created_at | date:'shortDate' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="missions.length === 0" class="empty-state">
        <div class="loader"></div>
        <p>Seeking active signal...</p>
      </div>
    </div>
  `,
  styles: `
    .mission-container {
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
      color: #e0e0e0;
    }

    .header {
      margin-bottom: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      background: linear-gradient(45deg, #ff3d00, #ffea00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
    }

    .header p {
      color: #888;
      font-size: 1.1rem;
    }

    .mission-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
    }

    .mission-card {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .mission-card:hover {
      transform: translateY(-8px);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .card-glow {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .mission-card:hover .card-glow {
      opacity: 1;
    }

    .card-content {
      padding: 24px;
      position: relative;
      z-index: 1;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 16px;
      background: rgba(255, 255, 255, 0.1);
    }

    .open .status-badge { color: #00e676; background: rgba(0, 230, 118, 0.1); }
    .inplus .status-badge { color: #2979ff; background: rgba(41, 121, 255, 0.1); }
    .success .status-badge { color: #ffea00; background: rgba(255, 234, 0, 0.1); }
    .failed .status-badge { color: #ff1744; background: rgba(255, 23, 68, 0.1); }

    h3 {
      font-size: 1.5rem;
      margin-bottom: 12px;
      color: #fff;
    }

    .description {
      color: #aaa;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 24px;
      height: 4.8em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .label {
      font-size: 0.7rem;
      color: #666;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .value {
      font-size: 1.1rem;
      color: #fff;
      font-family: 'Courier New', Courier, monospace;
    }

    .empty-state {
      text-align: center;
      padding: 100px 0;
    }

    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #FFF;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
})
export class MissionList {
  private missionService = inject(MissionService);
  missions: Mission[] = [];

  constructor() {
    this.missionService.getMissions().subscribe({
      next: (data) => {
        this.missions = data;
      },
      error: (err) => {
        console.error('Failed to fetch missions:', err);
      }
    });
  }
}
