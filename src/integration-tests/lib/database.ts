import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidV4 } from 'uuid';

export const DATABASE_URL = 'dummy';

export async function clearDatabase(): Promise<void> {
  const db = new Database(DATABASE_URL);
  await db.execute('DELETE FROM sentence_cards');
  await db.execute('DELETE FROM subtitle_lines');
  await db.execute('DELETE FROM episodes');
  await db.execute('DELETE FROM episode_groups');
}

function generateId(): string {
  return uuidV4();
}

export async function insertEpisodeGroup(params: {
  name: string;
  groupType?: 'album' | 'folder';
  displayOrder?: number;
  parentId?: string | null;
}): Promise<string> {
  const { name, groupType = 'album', displayOrder = 1, parentId = null } = params;
  const id = generateId();
  const now = new Date().toISOString();
  const db = new Database(DATABASE_URL);
  await db.execute(
    `INSERT INTO episode_groups (id, parent_group_id, content, display_order, group_type, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      parentId,
      JSON.stringify({
        id,
        parentId,
        name,
        displayOrder,
        groupType,
        updatedAt: now,
      }),
      displayOrder,
      groupType,
      now,
    ]
  );
  return id;
}

export async function insertEpisode(params: {
  episodeGroupId: string;
  title: string;
  displayOrder?: number;
  mediaPath?: string;
}): Promise<string> {
  const { episodeGroupId, title, displayOrder = 1, mediaPath } = params;
  const now = new Date().toISOString();
  const db = new Database(DATABASE_URL);

  const id = generateId();
  await db.execute(
    `INSERT INTO episodes (id, episode_group_id, content, updated_at)
     VALUES (?, ?, ?, ?)`,
    [
      id,
      episodeGroupId,
      JSON.stringify({
        id,
        episodeGroupId,
        title,
        mediaPath: mediaPath || `media/${id}/full.mp3`,
        learningLanguage: 'ja',
        explanationLanguage: 'en',
        displayOrder,
        createdAt: now,
        updatedAt: now,
      }),
      now,
    ]
  );

  return id;
}

export async function getEpisodeTitle(episodeId: string): Promise<string | null> {
  const db = new Database(DATABASE_URL);
  const rows = await db.select<{ content: string }[]>('SELECT content FROM episodes WHERE id = ?', [
    episodeId,
  ]);
  if (rows.length === 0) {
    return null;
  }
  const content = JSON.parse(rows[0].content);
  return content.title || null;
}

export async function insertSubtitleLine(params: {
  episodeId: string;
  startTimeMs: number;
  endTimeMs: number | null;
  originalText: string;
  correctedText?: string | null;
  translation?: string | null;
  explanation?: string | null;
  sentence?: string | null;
  sequenceNumber?: number;
  hidden?: boolean;
}): Promise<string> {
  const {
    episodeId,
    startTimeMs,
    endTimeMs,
    originalText,
    correctedText = null,
    translation = null,
    explanation = null,
    sentence = null,
    sequenceNumber,
    hidden = false,
  } = params;

  const db = new Database(DATABASE_URL);
  const rows = await db.select<{ max_sequence: number | null }[]>(
    'SELECT MAX(sequence_number) AS max_sequence FROM subtitle_lines WHERE episode_id = ?',
    [episodeId]
  );
  const nextSequence = sequenceNumber ?? (rows[0]?.max_sequence ?? 0) + 1;
  const id = generateId();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO subtitle_lines (id, episode_id, sequence_number, content, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      episodeId,
      nextSequence,
      JSON.stringify({
        id,
        episodeId,
        sequenceNumber: nextSequence,
        startTimeMs,
        endTimeMs,
        originalText,
        correctedText,
        translation,
        explanation,
        sentence,
        hidden,
        updatedAt: now,
      }),
      now,
    ]
  );

  return id;
}

export async function getSentenceCards(subtitleLineId: string): Promise<SentenceCard[]> {
  type SentenceCardRow = {
    id: string;
    subtitle_line_id: string;
    content: string;
    status: 'active' | 'suspended' | 'cache';
    updated_at: string;
  };

  function mapRowToSentenceCard(row: SentenceCardRow): SentenceCard {
    const content = JSON.parse(row.content) as {
      id?: string;
      subtitleLineId?: string;
      partOfSpeech?: string;
      expression?: string;
      sentence?: string;
      contextualDefinition?: string;
      coreMeaning?: string;
      status?: SentenceCardRow['status'];
      createdAt?: string;
    };
    const createdAt = content.createdAt ?? row.updated_at;
    return {
      id: content.id ?? '',
      subtitleLineId: content.subtitleLineId ?? '',
      partOfSpeech: content.partOfSpeech ?? '',
      expression: content.expression ?? '',
      sentence: content.sentence ?? '',
      contextualDefinition: content.contextualDefinition ?? '',
      coreMeaning: content.coreMeaning ?? '',
      status: content.status ?? 'active',
      createdAt: new Date(createdAt),
    };
  }
  const db = new Database(DATABASE_URL);
  const rows = await db.select<SentenceCardRow[]>(
    'SELECT * FROM sentence_cards WHERE subtitle_line_id = ?',
    [subtitleLineId]
  );
  return rows.map(mapRowToSentenceCard);
}

export async function insertSentenceCard(params: {
  subtitleLineId: string;
  expression: string;
  sentence: string;
  contextualDefinition: string;
  coreMeaning: string;
  partOfSpeech?: string;
  status?: 'active' | 'cache';
  createdAt?: string;
}): Promise<string> {
  const {
    subtitleLineId,
    expression,
    sentence,
    contextualDefinition,
    coreMeaning,
    partOfSpeech = 'noun',
    status = 'active',
    createdAt = new Date().toISOString(),
  } = params;

  const db = new Database(DATABASE_URL);
  const id = generateId();
  const content = JSON.stringify({
    id,
    subtitleLineId,
    partOfSpeech,
    expression,
    sentence,
    contextualDefinition,
    coreMeaning,
    status,
    createdAt,
    updatedAt: createdAt,
  });
  await db.execute(
    `INSERT INTO sentence_cards (id, subtitle_line_id, content, status, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, subtitleLineId, content, status, createdAt]
  );
  return id;
}
