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
    id TEXT PRIMARY KEY,
    episode_group_id TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE dialogues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episode_id TEXT NOT NULL,
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
