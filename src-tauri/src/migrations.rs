// cSpell:words AUTOINCREMENT
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "Create initial tables and insert default data",
        sql: r###"
            CREATE TABLE episode_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                display_order INTEGER NOT NULL,
                parent_group_id INTEGER,
                group_type TEXT NOT NULL,
                FOREIGN KEY(parent_group_id) REFERENCES episode_groups(id)
            );
            CREATE TABLE episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                episode_group_id INTEGER NOT NULL,
                display_order INTEGER NOT NULL,
                title TEXT NOT NULL,
                audio_path TEXT NOT NULL,
                script_path TEXT NOT NULL,
                duration_seconds INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(episode_group_id) REFERENCES episode_groups(id)
            );
            CREATE TABLE dialogues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                episode_id INTEGER NOT NULL,
                start_time_ms INTEGER NOT NULL,
                end_time_ms INTEGER NOT NULL,
                original_text TEXT NOT NULL,
                corrected_text TEXT,
                FOREIGN KEY(episode_id) REFERENCES episodes(id)
            );
            CREATE TABLE vocabulary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expression TEXT NOT NULL
            );
            CREATE VIRTUAL TABLE vocabulary_fts USING fts5(expression);
            CREATE TABLE sentence_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dialogue_id INTEGER NOT NULL,
                vocabulary_id INTEGER NOT NULL,
                target_expression TEXT NOT NULL,
                sentence TEXT NOT NULL,
                definition TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(dialogue_id) REFERENCES dialogues(id),
                FOREIGN KEY(vocabulary_id) REFERENCES vocabulary(id)
            );
            -- Default group (id=1, name='Default', parent_group_id=NULL, group_type='album')
            INSERT INTO episode_groups (id, name, display_order, parent_group_id, group_type)
            VALUES (1, 'Default', 0, NULL, 'album');
        "###,
        kind: MigrationKind::Up,
    }]
}
