use std::sync::Arc;

use league_of_legends::{
    config::config_loader,
    infrastructure::{database::postgresql_connection, http::http_serv::start},
};
use tracing::{error, info};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    let dotenvy_env = match config_loader::load() {
        Ok(env) => env,
        Err(e) => {
            error!("Failed to load ENV: {}", e);
            std::process::exit(1);
        }
    };

    info!(".ENV LOADED");

    let mut retry_count = 0;
    let max_retries = 100;
    let postgres_pool = loop {
        match postgresql_connection::establish_connection(&dotenvy_env.database.url) {
            Ok(pool) => break pool,
            Err(err) => {
                retry_count += 1;
                if retry_count >= max_retries {
                    error!("Fail to connect after {} attempts: {}", max_retries, err);
                    std::process::exit(1);
                }
                error!(
                    "Connection attempt {} failed: {}. Retrying in 2s...",
                    retry_count, err
                );
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            }
        }
    };
    info!("Connected DB");

    start(Arc::new(dotenvy_env), Arc::new(postgres_pool))
        .await
        .expect("Failed to start server");
}
