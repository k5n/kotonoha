CREATE TABLE episode_groups (
    id TEXT PRIMARY KEY,
    parent_group_id TEXT,
    content JSONB NOT NULL,
    display_order INTEGER NOT NULL,
    group_type TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE episodes (
    id TEXT PRIMARY KEY,
    episode_group_id TEXT NOT NULL,
    content JSONB NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE subtitle_lines (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE sentence_cards (
    id TEXT PRIMARY KEY,
    subtitle_line_id TEXT NOT NULL,
    content JSONB NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
