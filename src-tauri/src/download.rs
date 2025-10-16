use futures_util::StreamExt;
use reqwest;
use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::sync::{LazyLock, Mutex};
use std::time::Instant;
use tauri::{AppHandle, Emitter, Manager};
use tokio_util::sync::CancellationToken;

static DOWNLOAD_CANCEL_TOKENS: LazyLock<Mutex<HashMap<String, CancellationToken>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgressPayload {
    download_id: String,
    file_name: String,
    progress: u32,
    downloaded: u64,
    total: u64,
}

async fn download_file_with_progress_inner(
    app_handle: AppHandle,
    url: String,
    file_path: String,
    cancel_token: CancellationToken,
    download_id: String,
) -> Result<(), String> {
    let app_data_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let full_path = app_data_dir.join(&file_path);

    // ディレクトリを作成
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // HTTPクライアントを作成
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);

    // ファイルを作成
    let mut file = File::create(&full_path).map_err(|e| format!("Failed to create file: {}", e))?;

    let mut downloaded = 0u64;
    let mut stream = response.bytes_stream();
    let mut last_notification = Instant::now();

    while let Some(chunk) = stream.next().await {
        if cancel_token.is_cancelled() {
            return Err("Download cancelled".to_string());
        }

        let chunk = chunk.map_err(|e| format!("Failed to read chunk: {}", e))?;

        file.write_all(&chunk)
            .map_err(|e| format!("Failed to write chunk: {}", e))?;

        downloaded += chunk.len() as u64;

        // 進捗を報告
        if last_notification.elapsed() >= std::time::Duration::from_millis(200)
            || downloaded == total_size
        {
            let progress = if total_size > 0 {
                (downloaded as f64 / total_size as f64 * 100.0) as u32
            } else {
                0
            };

            app_handle
                .emit(
                    "download_progress",
                    DownloadProgressPayload {
                        download_id: download_id.clone(),
                        file_name: file_path
                            .split('/')
                            .last()
                            .unwrap_or(&file_path)
                            .to_string(),
                        progress,
                        downloaded,
                        total: total_size,
                    },
                )
                .unwrap();
            last_notification = Instant::now();
        }
    }

    file.flush()
        .map_err(|e| format!("Failed to flush file: {}", e))?;

    // 完了を報告
    app_handle
        .emit(
            "download_progress",
            DownloadProgressPayload {
                download_id: download_id.clone(),
                file_name: file_path
                    .split('/')
                    .last()
                    .unwrap_or(&file_path)
                    .to_string(),
                progress: 100,
                downloaded,
                total: total_size,
            },
        )
        .unwrap();

    Ok(())
}

#[tauri::command]
pub async fn download_file_with_progress(
    app_handle: AppHandle,
    url: String,
    file_path: String,
    download_id: String,
) -> Result<(), String> {
    // 同じ download_id への同時ダウンロードを防ぐ
    {
        let mut tokens = DOWNLOAD_CANCEL_TOKENS.lock().unwrap();
        if tokens.contains_key(&download_id) {
            return Err("Download already in progress for this download ID".to_string());
        }
        let cancel_token = CancellationToken::new();
        tokens.insert(download_id.clone(), cancel_token.clone());
    }

    let cancel_token = {
        let tokens = DOWNLOAD_CANCEL_TOKENS.lock().unwrap();
        tokens.get(&download_id).cloned().unwrap()
    };

    let result = download_file_with_progress_inner(
        app_handle,
        url,
        file_path.clone(),
        cancel_token,
        download_id.clone(),
    )
    .await;

    // 完了またはエラー時にトークンを削除
    DOWNLOAD_CANCEL_TOKENS.lock().unwrap().remove(&download_id);

    result
}

#[tauri::command]
pub fn cancel_download(download_id: String) -> Result<(), String> {
    if let Some(token) = DOWNLOAD_CANCEL_TOKENS.lock().unwrap().remove(&download_id) {
        token.cancel();
        Ok(())
    } else {
        Err("Download not found for this download ID".to_string())
    }
}
