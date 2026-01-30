use anyhow::Result;
use std::sync::Arc;

use crate::domain::{
    repositories::dashboard::DashboardRepository,
    value_objects::{
        dashboard_stats::{DashboardStats, UserDashboard},
        mission_model::MissionModel,
    },
};

pub struct DashboardUseCase<T>
where
    T: DashboardRepository + Send + Sync,
{
    dashboard_repository: Arc<T>,
}

impl<T> DashboardUseCase<T>
where
    T: DashboardRepository + Send + Sync,
{
    pub fn new(dashboard_repository: Arc<T>) -> Self {
        Self {
            dashboard_repository,
        }
    }

    pub async fn get_stats(&self) -> Result<DashboardStats> {
        self.dashboard_repository.get_stats().await
    }

    pub async fn get_recent_missions(&self, limit: i64) -> Result<Vec<MissionModel>> {
        self.dashboard_repository.get_recent_missions(limit).await
    }

    pub async fn get_user_dashboard(&self, brawler_id: i32) -> Result<UserDashboard> {
        self.dashboard_repository
            .get_user_dashboard(brawler_id)
            .await
    }

    pub async fn get_user_active_missions(
        &self,
        brawler_id: i32,
        limit: i64,
    ) -> Result<Vec<MissionModel>> {
        self.dashboard_repository
            .get_user_active_missions(brawler_id, limit)
            .await
    }

    pub async fn get_open_missions_for_user(
        &self,
        brawler_id: i32,
        limit: i64,
    ) -> Result<Vec<MissionModel>> {
        self.dashboard_repository
            .get_open_missions_for_user(brawler_id, limit)
            .await
    }
}
