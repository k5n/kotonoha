// cSpell:words AUTOINCREMENT
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "Create initial tables and insert default data",
        sql: include_str!("../migrations/0001-initial-tables.sql"),
        kind: MigrationKind::Up,
    }]
}
