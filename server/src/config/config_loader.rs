use std::env;

use anyhow::Result;
use tracing::error;

use crate::config::{
    config_model::{CloudinaryEnv, Database, DotEnvyConfig, JwtEnv, Server},
    stage::Stage,
};

pub fn load() -> Result<DotEnvyConfig> {
    dotenvy::dotenv().ok();

    let server = Server {
        // Check PORT first (for Render), then fall back to SERVER_PORT
        port: env::var("PORT")
            .or_else(|_| env::var("SERVER_PORT"))
            .expect("PORT or SERVER_PORT must be set")
            .parse()?,
        body_limit: env::var("SERVER_BODY_LIMIT")
            .unwrap_or_else(|_| "10".to_string())
            .parse()?,
        timeout: env::var("SERVER_TIMEOUT")
            .unwrap_or_else(|_| "30".to_string())
            .parse()?,
    };

    let database = Database {
        url: env::var("DATABASE_URL")
            .expect("DATABASE_URL is valid")
            .parse()?,
    };

    let secret = env::var("JWT_USER_SECRET")
        .expect("SECRET is valid")
        .parse()?;

    let config = DotEnvyConfig {
        server,
        database,
        secret,
    };

    Ok(config)
}

pub fn get_stage() -> Stage {
    dotenvy::dotenv().ok();

    let stage_str = env::var("STAGE").unwrap_or("".to_string());
    Stage::try_form(&stage_str).unwrap_or_default()
}

pub fn get_user_secret() -> Result<String> {
    let dotenvy_env = match load() {
        Ok(env) => env,
        Err(e) => {
            error!("Failed to load ENV: {}", e);
            std::process::exit(1);
        }
    };
    Ok(dotenvy_env.secret)
}

pub fn get_jwt_env() -> Result<JwtEnv> {
    dotenvy::dotenv().ok();
    Ok(JwtEnv {
        secret: env::var("JWT_USER_SECRET")?,
        ttl: env::var("JWT_TTL")?.parse::<i64>()?,
    })
}

pub fn get_cloudinary_env() -> Result<CloudinaryEnv> {
    dotenvy::dotenv().ok();

    let cloud_name = env::var("CLOUDINARY_CLOUD_NAME")?;
    let api_key = env::var("CLOUDINARY_API_KEY")?;
    let api_secret = env::var("CLOUDINARY_API_SECRET")?;

    Ok(CloudinaryEnv {
        cloud_name,
        api_key,
        api_secret,
    })
}
