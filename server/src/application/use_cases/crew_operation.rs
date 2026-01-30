use crate::domain::{
    entities::crew_memberships::CrewMemberShips,
    entities::missions::EditMissionEntity,
    repositories::{
        crew_operation::CrewOperationRepository, mission_management::MissionManagementRepository,
        mission_viewing::MissionViewingRepository,
    },
    value_objects::mission_statuses::MissionStatuses,
};
use anyhow::Result;
use std::sync::Arc;

// Note: MAX_CREW_PER_MISSION is now read from mission.max_crew, this constant is deprecated

pub struct CrewOperationUseCase<T1, T2, T3>
where
    T1: CrewOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionManagementRepository + Send + Sync,
{
    crew_operation_repository: Arc<T1>,
    mission_viewing_repository: Arc<T2>,
    mission_management_repository: Arc<T3>,
}

impl<T1, T2, T3> CrewOperationUseCase<T1, T2, T3>
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionManagementRepository + Send + Sync,
{
    pub fn new(
        crew_operation_repository: Arc<T1>,
        mission_viewing_repository: Arc<T2>,
        mission_management_repository: Arc<T3>,
    ) -> Self {
        Self {
            crew_operation_repository,
            mission_viewing_repository,
            mission_management_repository,
        }
    }

    pub async fn join(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self
            .mission_viewing_repository
            .view_detail(mission_id)
            .await?;

        let crew_count = self
            .mission_viewing_repository
            .crew_counting(mission_id)
            .await?;

        if mission.chief_id == brawler_id {
            return Err(anyhow::anyhow!(
                "The chief cannot join in his own mission as a crew member"
            ));
        }
        let mission_status_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string();
        if !mission_status_condition {
            return Err(anyhow::anyhow!("Mission is not joinable"));
        }

        if (crew_count as i64) >= (mission.max_crew as i64) {
            // Update status to Failed if room is full
            self.mission_management_repository
                .edit(
                    mission_id,
                    EditMissionEntity {
                        chief_id: mission.chief_id,
                        name: None,
                        status: Some(MissionStatuses::Failed.to_string()),
                        description: None,
                        max_crew: None,
                    },
                )
                .await?;
            return Err(anyhow::anyhow!("Mission is full"));
        }

        self.crew_operation_repository
            .join(CrewMemberShips {
                mission_id,
                brawler_id,
            })
            .await?;

        // Update status to Completed upon successful join
        self.mission_management_repository
            .edit(
                mission_id,
                EditMissionEntity {
                    chief_id: mission.chief_id,
                    name: None,
                    status: Some(MissionStatuses::Completed.to_string()),
                    description: None,
                    max_crew: None,
                },
            )
            .await?;

        Ok(())
    }

    pub async fn leave(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self
            .mission_viewing_repository
            .view_detail(mission_id)
            .await?;

        let leaving_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string()
            || mission.status == MissionStatuses::Completed.to_string();
        if !leaving_condition {
            return Err(anyhow::anyhow!("Mission is not leavable"));
        }

        self.crew_operation_repository
            .leave(CrewMemberShips {
                mission_id,
                brawler_id,
            })
            .await?;

        // Change mission status back to Open so it appears in Browse Missions
        self.mission_management_repository
            .edit(
                mission_id,
                EditMissionEntity {
                    chief_id: mission.chief_id,
                    name: None,
                    status: Some(MissionStatuses::Open.to_string()),
                    description: None,
                    max_crew: None,
                },
            )
            .await?;

        Ok(())
    }
}
