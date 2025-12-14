#!/usr/bin/env tsx
import type { Database as DatabaseType } from 'better-sqlite3';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const USAGE = 'Usage: npx tsx tools/migration-tool.ts <sqlite_db_path> <media_root_dir>';

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

type EpisodeRow = {
  id: number;
  media_path: string;
};

type SubtitleLineJson = {
  id: string;
  startTimeMs: number;
  endTimeMs: number | null;
  originalText: string;
  correctedText: string | null;
  translation: string | null;
  explanation: string | null;
  sentence: string | null;
  deletedAt: string | null;
};

type SentenceCardJson = {
  id: string;
  subtitleLineId: string;
  partOfSpeech: string;
  expression: string;
  sentence: string;
  contextualDefinition: string;
  coreMeaning: string;
  status: 'active' | 'suspended' | 'cache';
  createdAt: string;
  deletedAt: null;
};

function parseArgs() {
  const [dbPath, mediaRoot] = process.argv.slice(2);
  if (!dbPath || !mediaRoot) {
    console.error(USAGE);
    process.exit(1);
  }
  return {
    dbPath: path.resolve(dbPath),
    mediaRoot: path.resolve(mediaRoot),
  };
}

async function assertReadablePaths(dbPath: string, mediaRoot: string) {
  await fs.access(dbPath);
  const mediaStat = await fs.stat(mediaRoot);
  if (!mediaStat.isDirectory()) {
    throw new Error(`mediaRoot is not a directory: ${mediaRoot}`);
  }
}

function resolveMediaPath(mediaRoot: string, mediaPath: string) {
  const resolved = path.isAbsolute(mediaPath) ? mediaPath : path.resolve(mediaRoot, mediaPath);
  return resolved;
}

function ensureInsideRoot(targetPath: string, mediaRoot: string) {
  const root = path.resolve(mediaRoot) + path.sep;
  const dir = path.resolve(path.dirname(targetPath)) + path.sep;
  if (!dir.startsWith(root)) {
    throw new Error(`media_path directory is outside the provided mediaRoot: ${dir}`);
  }
}

function openDatabase(dbPath: string): DatabaseType {
  return new Database(dbPath, { readonly: true, fileMustExist: true });
}

function loadEpisodes(db: DatabaseType): EpisodeRow[] {
  return db.prepare<[], EpisodeRow>(`SELECT id, media_path FROM episodes`).all();
}

function loadDialogues(db: DatabaseType, episodeId: number): DialogueRow[] {
  return db
    .prepare<[number], DialogueRow>(
      `SELECT id, episode_id, start_time_ms, end_time_ms, original_text, corrected_text, translation, explanation, sentence, deleted_at
         FROM dialogues
         WHERE episode_id = ?
         ORDER BY start_time_ms, id`
    )
    .all(episodeId);
}

function loadSentenceCards(db: DatabaseType, episodeId: number): SentenceCardRow[] {
  return db
    .prepare<[number], SentenceCardRow>(
      `SELECT sc.id, sc.dialogue_id, sc.part_of_speech, sc.expression, sc.sentence, sc.contextual_definition, sc.core_meaning, sc.status, sc.created_at
         FROM sentence_cards sc
         JOIN dialogues d ON sc.dialogue_id = d.id
         WHERE d.episode_id = ?
         ORDER BY sc.id`
    )
    .all(episodeId);
}

function mapSubtitleLines(dialogues: DialogueRow[]): {
  lines: SubtitleLineJson[];
  idMap: Map<number, string>;
} {
  const idMap = new Map<number, string>();
  const lines: SubtitleLineJson[] = dialogues.map((d) => {
    const subtitleLineId = randomUUID();
    idMap.set(d.id, subtitleLineId);
    return {
      id: subtitleLineId,
      startTimeMs: d.start_time_ms,
      endTimeMs: d.end_time_ms,
      originalText: d.original_text,
      correctedText: d.corrected_text ?? null,
      translation: d.translation ?? null,
      explanation: d.explanation ?? null,
      sentence: d.sentence ?? null,
      deletedAt: d.deleted_at ?? null,
    };
  });
  return { lines, idMap };
}

function mapSentenceCards(rows: SentenceCardRow[], dialogueIdMap: Map<number, string>) {
  const cards: SentenceCardJson[] = [];
  const skipped: SentenceCardRow[] = [];

  for (const row of rows) {
    const subtitleLineId = dialogueIdMap.get(row.dialogue_id);
    if (!subtitleLineId) {
      skipped.push(row);
      continue;
    }
    cards.push({
      id: randomUUID(),
      subtitleLineId,
      partOfSpeech: row.part_of_speech,
      expression: row.expression,
      sentence: row.sentence,
      contextualDefinition: row.contextual_definition,
      coreMeaning: row.core_meaning,
      status: row.status,
      createdAt: row.created_at,
      deletedAt: null,
    });
  }

  return { cards, skipped };
}

async function writeJson(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function migrateEpisode(options: {
  db: DatabaseType;
  episode: EpisodeRow;
  mediaRoot: string;
}) {
  const { db, episode, mediaRoot } = options;
  const resolvedMediaPath = resolveMediaPath(mediaRoot, episode.media_path);
  ensureInsideRoot(resolvedMediaPath, mediaRoot);

  const mediaDir = path.dirname(resolvedMediaPath);
  const stat = await fs.stat(mediaDir).catch((err) => {
    throw new Error(
      `Media directory not found for episode ${episode.id}: ${mediaDir} (${err.message})`
    );
  });
  if (!stat.isDirectory()) {
    throw new Error(`Media path is not a directory for episode ${episode.id}: ${mediaDir}`);
  }

  const dialogues = loadDialogues(db, episode.id);
  const { lines, idMap } = mapSubtitleLines(dialogues);

  const sentenceCardRows = loadSentenceCards(db, episode.id);
  const { cards, skipped } = mapSentenceCards(sentenceCardRows, idMap);

  const subtitleFile = path.join(mediaDir, 'subtitleLines.json');
  const sentenceCardFile = path.join(mediaDir, 'sentenceCards.json');

  await writeJson(subtitleFile, lines);
  await writeJson(sentenceCardFile, cards);

  console.log(
    `Episode ${episode.id}: wrote subtitleLines.json (${lines.length}) and sentenceCards.json (${cards.length})` +
      (skipped.length ? `, skipped ${skipped.length} cards without matching dialogue` : '')
  );
}

async function main() {
  const { dbPath, mediaRoot } = parseArgs();
  try {
    await assertReadablePaths(dbPath, mediaRoot);
  } catch (err) {
    console.error(`Validation error: ${(err as Error).message}`);
    process.exit(1);
  }

  const db = openDatabase(dbPath);
  try {
    const episodes = loadEpisodes(db);
    if (!episodes.length) {
      console.log('No episodes found. Nothing to migrate.');
      return;
    }

    for (const episode of episodes) {
      await migrateEpisode({ db, episode, mediaRoot });
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error(`Migration failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

void main();
