use anyhow::Result;
use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

pub type PgPoolSquad = Pool<ConnectionManager<PgConnection>>;

pub fn establish_connection(database_url: &str) -> Result<PgPoolSquad> {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = Pool::builder()
        .connection_timeout(std::time::Duration::from_secs(10))
        .max_size(1)
        .build(manager)?;
    Ok(pool)
}
