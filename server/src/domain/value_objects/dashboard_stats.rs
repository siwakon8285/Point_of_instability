use diesel::prelude::*;
use serde::Serialize;

#[derive(Debug, QueryableByName, Serialize)]
pub struct DashboardStats {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_missions: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_brawlers: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub open_missions: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub active_missions: i64,
}

#[derive(Debug, QueryableByName, Serialize)]
pub struct UserDashboard {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub my_missions_count: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub joined_missions_count: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub success_count: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_participated: i64,
}
