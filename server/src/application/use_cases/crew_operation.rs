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
                        deadline: None,
                        duration: None,
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

        Ok(())
    }

    pub async fn leave(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self
            .mission_viewing_repository
            .view_detail(mission_id)
            .await?;

        let crew_count = self
            .mission_viewing_repository
            .crew_counting(mission_id)
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

        // Change mission status back to Open so it appears in Browse Missions,
        // BUT only if it is not Completed/InProgress, and if it was "Failed" due to being Full.
        let mut should_set_open = false;

        if mission.status == MissionStatuses::Open.to_string() {
            should_set_open = true;
        } else if mission.status == MissionStatuses::Failed.to_string() {
            // Only set to Open if it was actually full (which is why it might have been set to Failed automatically)
            // If it wasn't full, it means it was manually failed or failed for other reasons, so we shouldn't re-open it.
            if (crew_count as i64) >= (mission.max_crew as i64) {
                should_set_open = true;
            }
        }

        if should_set_open {
            self.mission_management_repository
                .edit(
                    mission_id,
                    EditMissionEntity {
                        chief_id: mission.chief_id,
                        name: None,
                        status: Some(MissionStatuses::Open.to_string()),
                        description: None,
                        max_crew: None,
                        deadline: None,
                        duration: None,
                    },
                )
                .await?;
        }

        Ok(())
    }

    pub async fn kick_member(&self, mission_id: i32, brawler_id: i32, chief_id: i32) -> Result<()> {
        let mission = self
            .mission_viewing_repository
            .view_detail(mission_id)
            .await?;

        if mission.chief_id != chief_id {
            return Err(anyhow::anyhow!("Only the chief can kick members"));
        }

        if brawler_id == chief_id {
            return Err(anyhow::anyhow!("Chief cannot kick themselves"));
        }

        // Allow kicking if mission is Open
        // If mission is Full(Failed) or InProgress, logic might vary.
        // Assuming we allow kicking in Open and InProgress (if desired), but standard flow is Open.
        // Let's stick to Open/Failed(Full) for now.
        // Actually, if status is InProgress, kicking might be bad?
        // User asked "Kick member who joined". Usually before start.
        // But let's check leave condition: Open, Failed, Completed(!?).
        let kickable_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string(); // Failed might mean Full here?

        if !kickable_condition {
            // If InProgress, maybe allow?
            // But existing leave logic allows Completed?? (See line 117).
            // Let's emulate leave condition but restricted to Chief actions.
            // Wait, if status is 'Completed', kicking makes no sense.
            // If 'InProgress', kicking might be needed.
            // I'll stick to safe default: Open or Failed (Full).
            return Err(anyhow::anyhow!(
                "Cannot kick member in current mission status"
            ));
        }

        self.crew_operation_repository
            .leave(CrewMemberShips {
                mission_id,
                brawler_id,
            })
            .await?;

        // If mission was Full (Failed), set it back to Open
        if mission.status == MissionStatuses::Failed.to_string() {
            let crew_count = self
                .mission_viewing_repository
                .crew_counting(mission_id)
                .await?;

            // Only re-open if it was full
            if (crew_count as i64) >= (mission.max_crew as i64) {
                self.mission_management_repository
                    .edit(
                        mission_id,
                        EditMissionEntity {
                            chief_id: mission.chief_id,
                            name: None,
                            status: Some(MissionStatuses::Open.to_string()),
                            description: None,
                            max_crew: None,
                            deadline: None,
                            duration: None,
                        },
                    )
                    .await?;
            }
        }

        Ok(())
    }
}
