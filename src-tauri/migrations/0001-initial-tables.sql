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
CREATE TABLE subtitle_lines (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL,
);
CREATE TABLE sentence_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtitle_line_id TEXT NOT NULL,
    part_of_speech TEXT NOT NULL,
    expression TEXT NOT NULL,
    sentence TEXT NOT NULL,
    contextual_definition TEXT NOT NULL,
    core_meaning TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
);
