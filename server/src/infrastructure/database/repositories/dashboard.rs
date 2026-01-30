use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use std::sync::Arc;

use crate::domain::{
    repositories::dashboard::DashboardRepository,
    value_objects::{
        dashboard_stats::{DashboardStats, UserDashboard},
        mission_model::MissionModel,
    },
};
use crate::infrastructure::database::postgresql_connection::PgPoolSquad;

pub struct DashboardPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl DashboardPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl DashboardRepository for DashboardPostgres {
    async fn get_stats(&self) -> Result<DashboardStats> {
        let mut conn = self.db_pool.get()?;

        let sql = r#"
            SELECT
                (SELECT COUNT(*) FROM missions WHERE deleted_at IS NULL) AS total_missions,
                (SELECT COUNT(*) FROM brawlers) AS total_brawlers,
                (SELECT COUNT(*) FROM missions WHERE deleted_at IS NULL AND status = 'Open') AS open_missions,
                (SELECT COUNT(*) FROM missions WHERE deleted_at IS NULL AND status = 'InProgress') AS active_missions
        "#;

        let result = diesel::sql_query(sql).get_result::<DashboardStats>(&mut conn)?;
        Ok(result)
    }

    async fn get_recent_missions(&self, limit: i64) -> Result<Vec<MissionModel>> {
        use diesel::sql_types::BigInt;

        let mut conn = self.db_pool.get()?;

        let sql = r#"
            SELECT
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS crew_count,
                m.max_crew,
                m.created_at,
                m.updated_at
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT $1
        "#;

        let results = diesel::sql_query(sql)
            .bind::<BigInt, _>(limit)
            .load::<MissionModel>(&mut conn)?;

        Ok(results)
    }

    async fn get_user_dashboard(&self, brawler_id: i32) -> Result<UserDashboard> {
        use diesel::sql_types::Int4;

        let mut conn = self.db_pool.get()?;

        let sql = r#"
            SELECT
                (SELECT COUNT(*) FROM missions WHERE chief_id = $1 AND deleted_at IS NULL) AS my_missions_count,
                (SELECT COUNT(*) FROM crew_memberships WHERE brawler_id = $1) AS joined_missions_count,
                (SELECT COUNT(*) FROM crew_memberships cm
                    INNER JOIN missions m ON m.id = cm.mission_id
                    WHERE cm.brawler_id = $1 AND m.status = 'Completed') AS success_count,
                (SELECT COUNT(*) FROM crew_memberships WHERE brawler_id = $1) +
                (SELECT COUNT(*) FROM missions WHERE chief_id = $1 AND deleted_at IS NULL) AS total_participated
        "#;

        let result = diesel::sql_query(sql)
            .bind::<Int4, _>(brawler_id)
            .get_result::<UserDashboard>(&mut conn)?;

        Ok(result)
    }

    async fn get_user_active_missions(
        &self,
        brawler_id: i32,
        limit: i64,
    ) -> Result<Vec<MissionModel>> {
        use diesel::sql_types::{BigInt, Int4};

        let mut conn = self.db_pool.get()?;

        let sql = r#"
            SELECT
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS crew_count,
                m.max_crew,
                m.created_at,
                m.updated_at
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.deleted_at IS NULL
                AND (m.chief_id = $1 OR EXISTS (
                    SELECT 1 FROM crew_memberships cm WHERE cm.mission_id = m.id AND cm.brawler_id = $1
                ))
                AND m.status IN ('Open', 'InProgress')
            ORDER BY m.updated_at DESC
            LIMIT $2
        "#;

        let results = diesel::sql_query(sql)
            .bind::<Int4, _>(brawler_id)
            .bind::<BigInt, _>(limit)
            .load::<MissionModel>(&mut conn)?;

        Ok(results)
    }

    async fn get_open_missions_for_user(
        &self,
        brawler_id: i32,
        limit: i64,
    ) -> Result<Vec<MissionModel>> {
        use diesel::sql_types::{BigInt, Int4};

        let mut conn = self.db_pool.get()?;

        let sql = r#"
            SELECT
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS crew_count,
                m.max_crew,
                m.created_at,
                m.updated_at
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.deleted_at IS NULL
                AND m.status = 'Open'
                AND m.chief_id != $1
                AND NOT EXISTS (
                    SELECT 1 FROM crew_memberships cm WHERE cm.mission_id = m.id AND cm.brawler_id = $1
                )
                AND (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) < m.max_crew
            ORDER BY m.created_at DESC
            LIMIT $2
        "#;

        let results = diesel::sql_query(sql)
            .bind::<Int4, _>(brawler_id)
            .bind::<BigInt, _>(limit)
            .load::<MissionModel>(&mut conn)?;

        Ok(results)
    }
}
