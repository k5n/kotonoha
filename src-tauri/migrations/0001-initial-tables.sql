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
    learning_language TEXT NOT NULL DEFAULT 'English',
    explanation_language TEXT NOT NULL DEFAULT 'Japanese',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(episode_group_id) REFERENCES episode_groups(id)
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
CREATE VIRTUAL TABLE sentence_cards_fts USING fts5(expression);
-- Default group (id=1, name='Default', parent_group_id=NULL, group_type='album')
INSERT INTO episode_groups (id, name, display_order, parent_group_id, group_type)
VALUES (1, 'Default', 0, NULL, 'album');
