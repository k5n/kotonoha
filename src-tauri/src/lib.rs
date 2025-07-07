// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// cSpell:words HWID
mod llm;
mod migrations;

use dotenvy::from_filename;
use llm::analyze_sentence_with_llm;
use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use migrations::get_migrations;
use std::env;

fn get_db_name() -> String {
    let env_file = if cfg!(debug_assertions) {
        ".env.development"
    } else {
        ".env.production"
    };
    let _ = from_filename(env_file);
    env::var("PUBLIC_APP_DB_NAME").unwrap_or_else(|_| "app.db".to_string())
}

/// Generates a hardware ID (HWID) for the system.
fn get_hwid() -> String {
    const HWID_KEY: &str = "3f8b0c3b519340974b0fa3aad09939402d969f52f1d84a4abac56f17e32623ba";
    IdBuilder::new(Encryption::SHA256)
        .add_component(HWIDComponent::SystemID)
        .add_component(HWIDComponent::OSName)
        .add_component(HWIDComponent::MachineName)
        .add_component(HWIDComponent::Username)
        .build(HWID_KEY)
        .unwrap_or_else(|_| HWID_KEY.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_name = get_db_name();
    let db_url = format!("sqlite:{}", db_name);
    println!("Using database URL: {}", db_url);

    tauri::Builder::default()
        .plugin(
            tauri_plugin_stronghold::Builder::new(|_| {
                // HWID is also hash, but it is only used to generate a unique identifier for the machine.
                // Argon2 is a memory-hard function that is designed to be slow and resistant to brute-force attacks.
                use argon2::{hash_raw, Config, Variant, Version};

                let config = Config {
                    lanes: 4,
                    mem_cost: 10_000,
                    time_cost: 10,
                    variant: Variant::Argon2id,
                    version: Version::Version13,
                    ..Default::default()
                };
                let salt = "kotonoha".as_bytes();
                let password = get_hwid();
                let key =
                    hash_raw(password.as_ref(), salt, &config).expect("failed to hash password");

                key.to_vec()
            })
            .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![analyze_sentence_with_llm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
