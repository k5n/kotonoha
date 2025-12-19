#!/usr/bin/env tsx
import type { Database as DatabaseType } from 'better-sqlite3';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const USAGE = 'Usage: npx tsx tools/migration-tool.ts <old_sqlite_db_path> <new_sqlite_db_path>';

type EpisodeGroupRow = {
  id: number;
  name: string;
  display_order: number;
  parent_group_id: number | null;
  group_type: string;
};

type EpisodeRow = {
  id: number;
  episode_group_id: number;
  display_order: number;
  title: string;
  media_path: string;
  learning_language: string;
  explanation_language: string;
  updated_at: string;
};

type DialogueRow = {
  id: number;
  episode_id: number;
  start_time_ms: number;
  end_time_ms: number | null;
  original_text: string;
  corrected_text: string | null;
  translation: string | null;
  explanation: string | null;
  sentence: string | null;
  deleted_at: string | null;
};

type SentenceCardRow = {
  id: number;
  dialogue_id: number;
  part_of_speech: string;
  expression: string;
  sentence: string;
  contextual_definition: string;
  core_meaning: string;
  status: 'active' | 'suspended' | 'cache';
  created_at: string;
};

function parseArgs() {
  const [oldDbPath, newDbPath] = process.argv.slice(2);
  if (!oldDbPath || !newDbPath) {
    console.error(USAGE);
    process.exit(1);
  }
  return {
    oldDbPath: path.resolve(oldDbPath),
    newDbPath: path.resolve(newDbPath),
  };
}

async function assertReadableOldDb(oldDbPath: string, newDbPath: string) {
  await fs.access(oldDbPath);
  try {
    await fs.access(newDbPath);
    throw new Error(`New DB already exists: ${newDbPath}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}

function openOldDatabase(dbPath: string): DatabaseType {
  return new Database(dbPath, { readonly: true, fileMustExist: true });
}

function openNewDatabase(dbPath: string): DatabaseType {
  return new Database(dbPath);
}

function formatTimestampForSql(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function createNewSchema(db: DatabaseType) {
  const statements = [
    // cSpell:words sqlx
    `CREATE TABLE _sqlx_migrations (
      version BIGINT PRIMARY KEY,
      description TEXT NOT NULL,
      installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      success BOOLEAN NOT NULL,
      checksum BLOB NOT NULL,
      execution_time BIGINT NOT NULL
  );`,
    `CREATE TABLE episode_groups (
      id TEXT PRIMARY KEY,
      parent_group_id TEXT,
      content TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      group_type TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );`,
    `CREATE TABLE episodes (
      id TEXT PRIMARY KEY,
      episode_group_id TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );`,
    `CREATE TABLE subtitle_lines (
      id TEXT PRIMARY KEY,
      episode_id TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );`,
    `CREATE TABLE sentence_cards (
      id TEXT PRIMARY KEY,
      subtitle_line_id TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );`,
  ];

  const create = db.transaction(() => {
    for (const sql of statements) {
      db.exec(sql);
    }
  });
  create();

  // Insert the initial migration record into _sqlx_migrations.
  // The user-provided checksum is stored as a blob and execution_time is set to 0.
  const initialChecksumHex =
    '98EBC1F080C1AEA6C5E31CE0B771F0B3861749B60D87009DEF7692C47EFECB3248BD52B5DDA0309E0C50E3BC206BD094';
  const installedOn = formatTimestampForSql(new Date());
  const insertStmt = db.prepare(
    `INSERT INTO _sqlx_migrations (version, description, installed_on, success, checksum, execution_time)
     VALUES (@version, @description, @installed_on, @success, @checksum, @execution_time)`
  );
  try {
    insertStmt.run({
      version: 1,
      description: 'Create initial tables and insert default data',
      installed_on: installedOn,
      success: 1,
      checksum: Buffer.from(initialChecksumHex, 'hex'),
      execution_time: 0,
    });
  } catch (err) {
    // If the insert fails due to primary key constraint (already present), ignore it.
    // Re-throw other unexpected errors.
    const sqliteErr = err as { code?: string };
    if (
      sqliteErr.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY' &&
      sqliteErr.code !== 'SQLITE_CONSTRAINT'
    ) {
      throw err;
    }
  }
}

function loadEpisodeGroups(db: DatabaseType): EpisodeGroupRow[] {
  return db
    .prepare<
      [],
      EpisodeGroupRow
    >(`SELECT id, name, display_order, parent_group_id, group_type FROM episode_groups ORDER BY id`)
    .all();
}

function loadEpisodes(db: DatabaseType): EpisodeRow[] {
  return db
    .prepare<
      [],
      EpisodeRow
    >(`SELECT id, episode_group_id, display_order, title, media_path, learning_language, explanation_language, updated_at FROM episodes ORDER BY id`)
    .all();
}

function loadDialogues(db: DatabaseType): DialogueRow[] {
  return db
    .prepare<[], DialogueRow>(
      `SELECT id, episode_id, start_time_ms, end_time_ms, original_text, corrected_text, translation, explanation, sentence, deleted_at
       FROM dialogues
       ORDER BY episode_id, start_time_ms, id`
    )
    .all();
}

function loadSentenceCards(db: DatabaseType): SentenceCardRow[] {
  return db
    .prepare<[], SentenceCardRow>(
      `SELECT id, dialogue_id, part_of_speech, expression, sentence, contextual_definition, core_meaning, status, created_at
       FROM sentence_cards
       ORDER BY id`
    )
    .all();
}

function deriveEpisodeIdFromMediaPath(mediaPath: string): string {
  // Expected pattern: <root>/<uuid>/<filename>
  const segments = mediaPath.split(/[\\/]+/).filter((s) => s.length > 0);
  const candidate = segments[1];
  if (!candidate) {
    throw new Error(
      `Cannot derive episode id from media_path (needs 2nd segment UUID): ${mediaPath}`
    );
  }
  return candidate;
}

function toIsoOrNow(value: string | null | undefined, now: string): string {
  if (!value) return now;
  return value;
}

function mapEpisodeGroups(rows: EpisodeGroupRow[], now: string) {
  const map = new Map<number, string>();

  // 1st pass: assign UUIDs
  for (const row of rows) {
    map.set(row.id, randomUUID());
  }

  // 2nd pass: create records with mapped parent ids
  const records = rows.map((row) => {
    const id = map.get(row.id)!;
    const parent_group_id =
      row.parent_group_id !== null ? (map.get(row.parent_group_id) ?? null) : null;
    const content = JSON.stringify({ name: row.name });
    return {
      id,
      parent_group_id,
      display_order: row.display_order,
      group_type: row.group_type,
      content,
      updated_at: now,
      deleted_at: null,
    };
  });

  return { records, map };
}

function mapEpisodes(rows: EpisodeRow[], episodeGroupMap: Map<number, string>, now: string) {
  const map = new Map<number, string>();
  const records = rows.map((row) => {
    const id = deriveEpisodeIdFromMediaPath(row.media_path);
    map.set(row.id, id);
    const content = JSON.stringify({
      title: row.title,
      mediaPath: row.media_path,
      learningLanguage: row.learning_language,
      explanationLanguage: row.explanation_language,
      displayOrder: row.display_order,
    });
    const episode_group_id = episodeGroupMap.get(row.episode_group_id) ?? null;
    if (!episode_group_id) {
      console.warn(`episode_group_id ${row.episode_group_id} not found. Inserting as NULL.`);
    }
    return {
      id,
      episode_group_id,
      content,
      updated_at: toIsoOrNow(row.updated_at, now),
      deleted_at: null,
    };
  });
  return { records, map };
}

function mapSubtitleLines(rows: DialogueRow[], episodeMap: Map<number, string>, now: string) {
  const map = new Map<number, string>();
  const grouped: Record<number, DialogueRow[]> = {};
  for (const row of rows) {
    grouped[row.episode_id] ??= [];
    grouped[row.episode_id].push(row);
  }

  const records: Array<{
    id: string;
    episode_id: string | null;
    sequence_number: number;
    content: string;
    updated_at: string;
    deleted_at: string | null;
  }> = [];

  for (const [episodeIdStr, dialogueRows] of Object.entries(grouped)) {
    const episodeId = Number(episodeIdStr);
    const episodeUuid = episodeMap.get(episodeId) ?? null;
    if (!episodeUuid) {
      console.warn(`episode_id ${episodeId} not found. Skipping ${dialogueRows.length} dialogues.`);
      continue;
    }
    const sorted = dialogueRows.sort((a, b) =>
      a.start_time_ms === b.start_time_ms ? a.id - b.id : a.start_time_ms - b.start_time_ms
    );
    sorted.forEach((row, idx) => {
      const id = randomUUID();
      map.set(row.id, id);
      const content = JSON.stringify({
        startTimeMs: row.start_time_ms,
        endTimeMs: row.end_time_ms,
        originalText: row.original_text,
        correctedText: row.corrected_text ?? null,
        translation: row.translation ?? null,
        explanation: row.explanation ?? null,
        sentence: row.sentence ?? null,
        hidden: row.deleted_at !== null,
      });
      records.push({
        id,
        episode_id: episodeUuid,
        sequence_number: idx + 1,
        content,
        updated_at: now,
        deleted_at: row.deleted_at ?? null,
      });
    });
  }

  return { records, map };
}

function mapSentenceCards(rows: SentenceCardRow[], dialogueMap: Map<number, string>, now: string) {
  const records: Array<{
    id: string;
    subtitle_line_id: string;
    content: string;
    status: string;
    updated_at: string;
    deleted_at: null;
  }> = [];
  let skipped = 0;

  for (const row of rows) {
    const subtitleLineId = dialogueMap.get(row.dialogue_id);
    if (!subtitleLineId) {
      skipped += 1;
      continue;
    }
    const id = randomUUID();
    const content = JSON.stringify({
      partOfSpeech: row.part_of_speech,
      expression: row.expression,
      sentence: row.sentence,
      contextualDefinition: row.contextual_definition,
      coreMeaning: row.core_meaning,
      createdAt: row.created_at,
    });
    records.push({
      id,
      subtitle_line_id: subtitleLineId,
      content,
      status: row.status,
      updated_at: now,
      deleted_at: null,
    });
  }

  return { records, skipped };
}

function insertEpisodeGroups(
  db: DatabaseType,
  records: ReturnType<typeof mapEpisodeGroups>['records']
) {
  const stmt = db.prepare(
    `INSERT INTO episode_groups (id, parent_group_id, content, display_order, group_type, updated_at, deleted_at)
     VALUES (@id, @parent_group_id, @content, @display_order, @group_type, @updated_at, @deleted_at)`
  );
  const insert = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insert(records);
}

function insertEpisodes(db: DatabaseType, records: ReturnType<typeof mapEpisodes>['records']) {
  const stmt = db.prepare(
    `INSERT INTO episodes (id, episode_group_id, content, updated_at, deleted_at)
     VALUES (@id, @episode_group_id, @content, @updated_at, @deleted_at)`
  );
  const insert = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insert(records);
}

function insertSubtitleLines(
  db: DatabaseType,
  records: ReturnType<typeof mapSubtitleLines>['records']
) {
  const stmt = db.prepare(
    `INSERT INTO subtitle_lines (id, episode_id, sequence_number, content, updated_at, deleted_at)
     VALUES (@id, @episode_id, @sequence_number, @content, @updated_at, @deleted_at)`
  );
  const insert = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insert(records);
}

function insertSentenceCards(
  db: DatabaseType,
  records: ReturnType<typeof mapSentenceCards>['records']
) {
  const stmt = db.prepare(
    `INSERT INTO sentence_cards (id, subtitle_line_id, content, status, updated_at, deleted_at)
     VALUES (@id, @subtitle_line_id, @content, @status, @updated_at, @deleted_at)`
  );
  const insert = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insert(records);
}

async function main() {
  const { oldDbPath, newDbPath } = parseArgs();
  try {
    await assertReadableOldDb(oldDbPath, newDbPath);
  } catch (err) {
    console.error(`Validation error: ${(err as Error).message}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const oldDb = openOldDatabase(oldDbPath);
  const newDb = openNewDatabase(newDbPath);

  try {
    createNewSchema(newDb);

    const episodeGroups = loadEpisodeGroups(oldDb);
    const episodes = loadEpisodes(oldDb);
    const dialogues = loadDialogues(oldDb);
    const sentenceCards = loadSentenceCards(oldDb);

    const { records: groupRecords, map: episodeGroupMap } = mapEpisodeGroups(episodeGroups, now);
    const { records: episodeRecords, map: episodeMap } = mapEpisodes(
      episodes,
      episodeGroupMap,
      now
    );
    const { records: subtitleRecords, map: dialogueMap } = mapSubtitleLines(
      dialogues,
      episodeMap,
      now
    );
    const { records: cardRecords, skipped } = mapSentenceCards(sentenceCards, dialogueMap, now);

    insertEpisodeGroups(newDb, groupRecords);
    insertEpisodes(newDb, episodeRecords);
    insertSubtitleLines(newDb, subtitleRecords);
    insertSentenceCards(newDb, cardRecords);

    console.log('Migration completed.');
    console.log(`Episode groups: ${groupRecords.length}`);
    console.log(`Episodes: ${episodeRecords.length}`);
    console.log(`Subtitle lines: ${subtitleRecords.length}`);
    console.log(`Sentence cards: ${cardRecords.length}`);
    if (skipped) {
      console.warn(`Skipped sentence cards without matching dialogue: ${skipped}`);
    }
  } catch (err) {
    console.error(`Migration failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    oldDb.close();
    newDb.close();
  }
}

void main();
