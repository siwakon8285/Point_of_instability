use crate::config::{config_loader::get_cloudinary_env, config_model::CloudinaryEnv};
use crate::domain::value_objects::base64_image::Base64Image;
use crate::domain::value_objects::uploaded_image::{UploadImageOptions, UploadedImage};
use anyhow::{Context, Result};
use chrono::Utc;
use reqwest::multipart::{Form, Part};
use sha1::{Digest, Sha1};
use std::collections::BTreeMap;

fn form_builder(option: UploadImageOptions, cloud_env: &CloudinaryEnv) -> Result<Form> {
    let mut form = Form::new();
    let timestamp = Utc::now().timestamp().to_string();

    let mut params_to_sign: BTreeMap<String, String> = BTreeMap::new();
    params_to_sign.insert("timestamp".to_string(), timestamp.clone());

    if let Some(folder_name) = option.folder {
        params_to_sign.insert("folder".to_string(), folder_name);
    }
    if let Some(public_id) = option.public_id {
        params_to_sign.insert("public_id".to_string(), public_id);
    }
    if let Some(transformation) = option.transformation {
        params_to_sign.insert("transformation".to_string(), transformation);
    }

    let mut to_sign = String::new();
    for (i, (key, value)) in params_to_sign.iter().enumerate() {
        if i > 0 {
            to_sign.push('&');
        }
        to_sign.push_str(&format!("{}={}", key, value));
        form = form.text(key.clone(), value.clone());
    }
    to_sign.push_str(&cloud_env.api_secret);

    let mut hasher = Sha1::new();
    hasher.update(to_sign.as_bytes());
    let signature = format!("{:x}", hasher.finalize());

    form = form.text("signature", signature);
    form = form.text("api_key", cloud_env.api_key.clone());

    Ok(form)
}

pub async fn upload(
    base64_image: Base64Image,
    option: UploadImageOptions,
) -> Result<UploadedImage> {
    let cloud_env = get_cloudinary_env()?;
    let form = form_builder(option, &cloud_env)?;

    let file = Part::text(base64_image.into_inner());
    let multipart = form.part("file", file);

    let client = reqwest::Client::new();
    let url = format!(
        "https://api.cloudinary.com/v1_1/{}/image/upload",
        cloud_env.cloud_name
    );

    let response = client
        .post(&url)
        .multipart(multipart)
        .send()
        .await
        .context(format!("Failed to send request to {}", url))?;

    let status = response.status();
    let text = response
        .text()
        .await
        .context("Failed to read response text")?;

    if !status.is_success() {
        return Err(anyhow::anyhow!(
            "Cloudinary upload failed ({}): {}",
            status,
            text
        ));
    }

    let json: UploadedImage = serde_json::from_str(&text).map_err(|e| {
        anyhow::anyhow!(
            "Failed to parse Cloudinary response: {} | Error: {}",
            text,
            e
        )
    })?;

    Ok(json)
}
