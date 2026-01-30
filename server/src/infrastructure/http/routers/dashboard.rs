use axum::{
    Extension, Json, Router, extract::State, http::StatusCode, response::IntoResponse, routing::get,
};
use serde::Serialize;
use std::sync::Arc;

use crate::{
    application::use_cases::dashboard::DashboardUseCase,
    domain::repositories::dashboard::DashboardRepository,
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad, repositories::dashboard::DashboardPostgres,
        },
        http::middleware::auth::authorization,
    },
};

#[derive(Serialize)]
pub struct UserDashboardResponse {
    pub stats: crate::domain::value_objects::dashboard_stats::UserDashboard,
    pub active_missions: Vec<crate::domain::value_objects::mission_model::MissionModel>,
    pub open_missions: Vec<crate::domain::value_objects::mission_model::MissionModel>,
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = DashboardPostgres::new(Arc::clone(&db_pool));
    let use_case = Arc::new(DashboardUseCase::new(Arc::new(repository)));

    // Public routes
    let public_routes = Router::new()
        .route("/stats", get(get_stats))
        .route("/recent-missions", get(get_recent_missions))
        .with_state(Arc::clone(&use_case));

    // Protected routes - need separate state clone
    let protected_routes = Router::new()
        .route("/me", get(get_user_dashboard))
        .route_layer(axum::middleware::from_fn(authorization))
        .with_state(use_case);

    public_routes.merge(protected_routes)
}

pub async fn get_stats<T>(State(use_case): State<Arc<DashboardUseCase<T>>>) -> impl IntoResponse
where
    T: DashboardRepository + Send + Sync + 'static,
{
    match use_case.get_stats().await {
        Ok(stats) => (StatusCode::OK, Json(stats)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_recent_missions<T>(
    State(use_case): State<Arc<DashboardUseCase<T>>>,
) -> impl IntoResponse
where
    T: DashboardRepository + Send + Sync + 'static,
{
    match use_case.get_recent_missions(5).await {
        Ok(missions) => (StatusCode::OK, Json(missions)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_user_dashboard<T>(
    State(use_case): State<Arc<DashboardUseCase<T>>>,
    Extension(brawler_id): Extension<i32>,
) -> impl IntoResponse
where
    T: DashboardRepository + Send + Sync + 'static,
{
    let stats = match use_case.get_user_dashboard(brawler_id).await {
        Ok(s) => s,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    let active_missions = match use_case.get_user_active_missions(brawler_id, 3).await {
        Ok(m) => m,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    let open_missions = match use_case.get_open_missions_for_user(brawler_id, 3).await {
        Ok(m) => m,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    let response = UserDashboardResponse {
        stats,
        active_missions,
        open_missions,
    };

    (StatusCode::OK, Json(response)).into_response()
}
