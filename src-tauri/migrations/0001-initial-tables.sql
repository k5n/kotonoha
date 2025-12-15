CREATE TABLE episode_groups (
    id TEXT PRIMARY KEY,
    parent_group_id TEXT,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    group_type TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episode_group_id TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    media_path TEXT NOT NULL,
    learning_language TEXT NOT NULL DEFAULT 'English',
    explanation_language TEXT NOT NULL DEFAULT 'Japanese',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
);
CREATE TABLE dialogues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episode_id INTEGER NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER,
    original_text TEXT NOT NULL,
    corrected_text TEXT,
    translation TEXT,
    explanation TEXT,
    sentence TEXT,
    deleted_at TEXT,
    FOREIGN KEY(episode_id) REFERENCES episodes(id)
);
CREATE TABLE sentence_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dialogue_id INTEGER NOT NULL,
    part_of_speech TEXT NOT NULL,
    expression TEXT NOT NULL,
    sentence TEXT NOT NULL,
    contextual_definition TEXT NOT NULL,
    core_meaning TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(dialogue_id) REFERENCES dialogues(id)
);
