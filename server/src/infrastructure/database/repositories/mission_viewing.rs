use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use std::sync::Arc;

use crate::domain::{
    repositories::mission_viewing::MissionViewingRepository,
    value_objects::{
        brawler_model::BrawlerModel, mission_filter::MissionFilter, mission_model::MissionModel,
    },
};
use crate::infrastructure::database::{
    postgresql_connection::PgPoolSquad, schema::crew_memberships,
};

pub struct MissionViewingPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl MissionViewingPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl MissionViewingRepository for MissionViewingPostgres {
    async fn view_detail(&self, mission_id: i32) -> Result<MissionModel> {
        use diesel::sql_types::Int4;

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
                m.created_at,
                m.updated_at
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.id = $1 AND m.deleted_at IS NULL
        "#;

        let result = diesel::sql_query(sql)
            .bind::<Int4, _>(mission_id)
            .get_result::<MissionModel>(&mut conn)?;

        Ok(result)
    }

    async fn gets(&self, filter: &MissionFilter) -> Result<Vec<MissionModel>> {
        use diesel::sql_types::{Int4, Nullable, Varchar};

        let mut conn = Arc::clone(&self.db_pool).get()?;

        let sql = r#"
            SELECT 
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS crew_count,
                m.created_at,
                m.updated_at
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.deleted_at IS NULL
                AND ($1 IS NULL OR LOWER(m.status) = LOWER($1))
                AND ($2 IS NULL OR m.name ILIKE $2)
                AND ($3 IS NULL OR m.chief_id != $3)
                AND ($4 IS NULL OR NOT EXISTS (
                    SELECT 1 FROM crew_memberships cm_ex 
                    WHERE cm_ex.mission_id = m.id AND cm_ex.brawler_id = $4
                ))
                AND ($5 IS NULL OR m.chief_id = $5)
                AND ($6 IS NULL OR EXISTS (
                    SELECT 1 FROM crew_memberships cm_in 
                    WHERE cm_in.mission_id = m.id AND cm_in.brawler_id = $6
                ))
            ORDER BY m.created_at DESC
        "#;

        // Prepare optional bind values
        let status_bind: Option<String> = filter.status.as_ref().map(|s| s.to_string());
        let name_bind: Option<String> = filter.name.as_ref().map(|n| format!("%{}%", n));

        let rows = diesel::sql_query(sql)
            .bind::<Nullable<Varchar>, _>(status_bind)
            .bind::<Nullable<Varchar>, _>(name_bind)
            .bind::<Nullable<Int4>, _>(filter.exclude_owned_by)
            .bind::<Nullable<Int4>, _>(filter.exclude_joined_by)
            .bind::<Nullable<Int4>, _>(filter.owned_by)
            .bind::<Nullable<Int4>, _>(filter.joined_by)
            .load::<MissionModel>(&mut conn)?;

        Ok(rows)
    }

    async fn crew_counting(&self, mission_id: i32) -> Result<u32> {
        let mut conn = self.db_pool.get()?;

        let count = crew_memberships::table
            .filter(crew_memberships::mission_id.eq(mission_id))
            .count()
            .get_result::<i64>(&mut conn)?;

        Ok(count as u32)
    }

    async fn get_mission_crew(&self, mission_id: i32) -> Result<Vec<BrawlerModel>> {
        let mut conn = self.db_pool.get()?;

        let sql = r#"
            SELECT 
                b.display_name,
                COALESCE(b.avatar_url, '') AS avatar_url,
                COALESCE(s.success_count, 0) AS mission_success_count,
                COALESCE(j.joined_count, 0) AS mission_joined_count
            FROM crew_memberships cm
            INNER JOIN brawlers b ON b.id = cm.brawler_id
            LEFT JOIN (
                SELECT cm2.brawler_id, COUNT(*) AS success_count
                FROM crew_memberships cm2
                INNER JOIN missions m2 ON m2.id = cm2.mission_id
                WHERE m2.status = 'SUCCESS'
                GROUP BY cm2.brawler_id
            ) s ON s.brawler_id = b.id
            LEFT JOIN (
                SELECT cm3.brawler_id, COUNT(*) AS joined_count
                FROM crew_memberships cm3
                GROUP BY cm3.brawler_id
            ) j ON j.brawler_id = b.id
            WHERE cm.mission_id = $1
        "#;

        let results = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .load::<BrawlerModel>(&mut conn)?;

        Ok(results)
    }
}
