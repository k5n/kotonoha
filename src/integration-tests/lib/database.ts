import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';

export const DATABASE_URL = 'dummy';

export async function clearDatabase(): Promise<void> {
  const db = new Database(DATABASE_URL);
  await db.execute('DELETE FROM sentence_cards');
  await db.execute('DELETE FROM dialogues');
  await db.execute('DELETE FROM episodes');
  await db.execute('DELETE FROM episode_groups');
  await db.execute(
    "DELETE FROM sqlite_sequence WHERE name IN ('episode_groups','episodes','dialogues','sentence_cards')"
  );
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}`;
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
    `INSERT INTO episode_groups (id, parent_group_id, content, display_order, group_type, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, parentId, JSON.stringify({ name }), displayOrder, groupType, now]
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
    `INSERT INTO episodes (id, episode_group_id, content, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, NULL)`,
    [
      id,
      episodeGroupId,
      JSON.stringify({
        title,
        mediaPath: mediaPath || `media/${id}/full.mp3`,
        learningLanguage: 'ja',
        explanationLanguage: 'en',
        displayOrder,
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

export async function insertDialogue(params: {
  episodeId: string;
  startTimeMs: number;
  endTimeMs: number | null;
  originalText: string;
  correctedText?: string | null;
  translation?: string | null;
  explanation?: string | null;
  sentence?: string | null;
  deletedAt?: string | null;
}): Promise<number> {
  const {
    episodeId,
    startTimeMs,
    endTimeMs,
    originalText,
    correctedText = null,
    translation = null,
    explanation = null,
    sentence = null,
    deletedAt = null,
  } = params;

  const db = new Database(DATABASE_URL);
  await db.execute(
    `INSERT INTO dialogues (episode_id, start_time_ms, end_time_ms, original_text, corrected_text, translation, explanation, sentence, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      episodeId,
      startTimeMs,
      endTimeMs,
      originalText,
      correctedText,
      translation,
      explanation,
      sentence,
      deletedAt,
    ]
  );

  const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id');
  return rows[0]?.id ?? 0;
}

export async function getSentenceCards(dialogueId: number): Promise<SentenceCard[]> {
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

  function mapRowToSentenceCard(row: SentenceCardRow): SentenceCard {
    return {
      id: row.id,
      dialogueId: row.dialogue_id,
      partOfSpeech: row.part_of_speech,
      expression: row.expression,
      sentence: row.sentence,
      contextualDefinition: row.contextual_definition,
      coreMeaning: row.core_meaning,
      status: row.status,
      createdAt: new Date(row.created_at),
    };
  }
  const db = new Database(DATABASE_URL);
  const rows = await db.select<SentenceCardRow[]>(
    'SELECT * FROM sentence_cards WHERE dialogue_id = ?',
    [dialogueId]
  );
  return rows.map(mapRowToSentenceCard);
}
