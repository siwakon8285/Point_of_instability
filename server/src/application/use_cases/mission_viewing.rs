use anyhow::Result;
use std::sync::Arc;

use crate::domain::{
    repositories::mission_viewing::MissionViewingRepository,
    value_objects::{
        brawler_model::BrawlerModel, mission_filter::MissionFilter, mission_model::MissionModel,
    },
};

pub struct MissionViewingUseCase<T>
where
    T: MissionViewingRepository + Send + Sync,
{
    mission_viewing_repository: Arc<T>,
}

impl<T> MissionViewingUseCase<T>
where
    T: MissionViewingRepository + Send + Sync,
{
    pub fn new(mission_viewing_repository: Arc<T>) -> Self {
        Self {
            mission_viewing_repository,
        }
    }

    pub async fn view_detail(&self, mission_id: i32) -> Result<MissionModel> {
        self.mission_viewing_repository
            .view_detail(mission_id)
            .await
    }

    pub async fn get(&self, filter: &MissionFilter) -> Result<Vec<MissionModel>> {
        self.mission_viewing_repository.gets(filter).await
    }

    pub async fn get_mission_crew(&self, mission_id: i32) -> Result<Vec<BrawlerModel>> {
        self.mission_viewing_repository
            .get_mission_crew(mission_id)
            .await
    }
}
