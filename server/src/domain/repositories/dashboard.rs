use anyhow::Result;
use async_trait::async_trait;

use crate::domain::value_objects::{
    dashboard_stats::{DashboardStats, UserDashboard},
    mission_model::MissionModel,
};

#[async_trait]
pub trait DashboardRepository: Send + Sync {
    async fn get_stats(&self) -> Result<DashboardStats>;
    async fn get_recent_missions(&self, limit: i64) -> Result<Vec<MissionModel>>;
    async fn get_user_dashboard(&self, brawler_id: i32) -> Result<UserDashboard>;
    async fn get_user_active_missions(
        &self,
        brawler_id: i32,
        limit: i64,
    ) -> Result<Vec<MissionModel>>;
    async fn get_open_missions_for_user(
        &self,
        brawler_id: i32,
        limit: i64,
    ) -> Result<Vec<MissionModel>>;
}
