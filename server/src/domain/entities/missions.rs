use crate::infrastructure::database::schema::missions;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Debug, Clone, Identifiable, Selectable, Queryable)]
#[diesel(check_for_backend(diesel::pg::Pg))]
#[diesel(table_name = missions)]
pub struct MissionEntity {
    pub id: i32,
    pub chief_id: i32,
    pub name: String,
    pub status: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub max_crew: i32,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = missions)]
pub struct AddMissionEntity {
    pub chief_id: i32,
    pub name: String,
    pub status: String,
    pub description: Option<String>,
    pub max_crew: i32,
}

#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = missions)]
pub struct EditMissionEntity {
    pub chief_id: i32,
    pub name: Option<String>,
    pub status: Option<String>,
    pub description: Option<String>,
    pub max_crew: Option<i32>,
}
