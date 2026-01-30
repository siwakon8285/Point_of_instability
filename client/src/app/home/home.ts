import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PassportService } from '../_services/passport-service';
import { DashboardService, DashboardStats, UserDashboard } from '../_services/dashboard-service';
import { MissionService } from '../_services/mission-service';
import { Mission } from '../_models/mission';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, DatePipe, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  private _passportService = inject(PassportService);
  private _dashboardService = inject(DashboardService);
  private _missionService = inject(MissionService);
  private _router = inject(Router);
  private _autoRefreshSub?: Subscription;

  // Authentication state
  isLoggedIn = computed(() => this._passportService.isSignin());
  displayName = computed(() => this._passportService.data()?.display_name || 'Brawler');

  // Public stats (for guests)
  publicStats = signal<DashboardStats | null>(null);
  recentMissions = signal<Mission[]>([]);

  // Authenticated user data
  userDashboard = signal<UserDashboard | null>(null);

  // Loading states
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    await this.loadData();
    // Auto-refresh every 10 seconds
    this._autoRefreshSub = interval(10000).subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    this._autoRefreshSub?.unsubscribe();
  }

  private async loadData() {
    this.isLoading.set(true);
    try {
      if (this.isLoggedIn()) {
        // Load authenticated user dashboard
        const dashboard = await this._dashboardService.getUserDashboard();
        this.userDashboard.set(dashboard);

        // Also load public stats for context
        const stats = await this._dashboardService.getStats();
        this.publicStats.set(stats);
      } else {
        // Load public data for guests
        const [stats, missions] = await Promise.all([
          this._dashboardService.getStats(),
          this._dashboardService.getRecentMissions()
        ]);
        this.publicStats.set(stats);
        this.recentMissions.set(missions);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed for success rate
  successRate = computed(() => {
    const dashboard = this.userDashboard();
    if (!dashboard || dashboard.stats.total_participated === 0) return 0;
    return Math.round((dashboard.stats.success_count / dashboard.stats.total_participated) * 100);
  });

  // Navigation helpers
  goToLogin() {
    this._router.navigate(['/login']);
  }

  goToMissions() {
    this._router.navigate(['/missions']);
  }

  goToMyMissions() {
    this._router.navigate(['/chief']);
  }

  async joinMission(missionId: number) {
    try {
      await this._missionService.join(missionId);
      // Reload dashboard after joining
      await this.loadData();
    } catch (error) {
      console.error('Failed to join mission', error);
    }
  }
}
