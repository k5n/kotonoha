// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod llm;
mod migrations;
mod stronghold;

use dotenvy::from_filename;
use llm::analyze_sentence_with_llm;
use migrations::get_migrations;
use std::env;
use stronghold::{create_salt_file_if_not_exists, get_stronghold_password};
use tauri::Manager;

fn get_db_name() -> String {
    let env_file = if cfg!(debug_assertions) {
        ".env.development"
    } else {
        ".env.production"
    };
    let _ = from_filename(env_file);
    env::var("PUBLIC_APP_DB_NAME").unwrap_or_else(|_| "app.db".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_name = get_db_name();
    let db_url = format!("sqlite:{}", db_name);
    println!("Using database URL: {}", db_url);

    tauri::Builder::default()
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
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, get_migrations())
                .build(),
        )
        .plugin(
            tauri_plugin_log::Builder::new()
                .max_file_size(1 * 1024 * 1024)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(5))
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            analyze_sentence_with_llm,
            get_stronghold_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
