// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod audio;
mod language_detection;
mod llm;
mod migrations;
mod stronghold;
mod tts;
mod youtube;

use dotenvy::from_filename;
use std::{env, fs};
use tauri::Manager;

use audio::{
    analyze_audio, copy_audio_file, open_audio, pause_audio, play_audio, resume_audio, seek_audio,
    stop_audio, AudioState,
};
use language_detection::detect_language_from_text;
use llm::analyze_sentence_with_llm;
use migrations::get_migrations;
use stronghold::{create_salt_file_if_not_exists, get_stronghold_password};
use tts::start_tts;
use youtube::fetch_youtube_subtitle;

fn get_db_name() -> String {
    if cfg!(debug_assertions) {
        let _ = from_filename(".env.development");
        env::var("PUBLIC_APP_DB_NAME").unwrap_or_else(|_| "app.db".to_string())
    } else {
        "app.db".to_string()
    }
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_name = get_db_name();
    let db_url = format!("sqlite:{}", db_name);

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AudioState::default())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, get_migrations())
                .build(),
        )
        .plugin(if cfg!(debug_assertions) {
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .level(log::LevelFilter::Debug)
                .build()
        } else {
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .max_file_size(1 * 1024 * 1024)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(5))
                .build()
        })
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");
            create_salt_file_if_not_exists(&salt_path)?;
            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            analyze_sentence_with_llm,
            get_stronghold_password,
            open_audio,
            analyze_audio,
            play_audio,
            pause_audio,
            resume_audio,
            stop_audio,
            seek_audio,
            read_text_file,
            copy_audio_file,
            fetch_youtube_subtitle,
            start_tts,
            detect_language_from_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
