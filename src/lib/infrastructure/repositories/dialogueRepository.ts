import type { NewSubtitleLine, SubtitleLine } from '$lib/domain/entities/subtitleLine';
import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidV4 } from 'uuid';
import { getDatabasePath } from '../config';

type SubtitleLineRow = {
  id: string;
  episode_id: string;
  sequence_number: number;
  content: string;
  updated_at: string;
  deleted_at: string | null;
};

type SubtitleLineContent = {
  startTimeMs?: number;
  endTimeMs?: number | null;
  originalText?: string;
  correctedText?: string | null;
  translation?: string | null;
  explanation?: string | null;
  sentence?: string | null;
  hidden?: string | null;
};

function parseSubtitleLineContent(raw: string): SubtitleLineContent | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as SubtitleLineContent;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function normalizeSubtitleLineContent(content: SubtitleLineContent): Required<SubtitleLineContent> {
  return {
    startTimeMs: typeof content.startTimeMs === 'number' ? content.startTimeMs : 0,
    endTimeMs: typeof content.endTimeMs === 'number' ? content.endTimeMs : null,
    originalText: typeof content.originalText === 'string' ? content.originalText : '',
    correctedText: typeof content.correctedText === 'string' ? content.correctedText : null,
    translation: typeof content.translation === 'string' ? content.translation : null,
    explanation: typeof content.explanation === 'string' ? content.explanation : null,
    sentence: typeof content.sentence === 'string' ? content.sentence : null,
    hidden: typeof content.hidden === 'string' ? content.hidden : null,
  };
}

function mapRowToSubtitleLine(row: SubtitleLineRow): SubtitleLine {
  const content = normalizeSubtitleLineContent(parseSubtitleLineContent(row.content) ?? {});
  return {
    id: row.id,
    episodeId: row.episode_id,
    sequenceNumber: row.sequence_number,
    startTimeMs: content.startTimeMs,
    endTimeMs: content.endTimeMs,
    originalText: content.originalText,
    correctedText: content.correctedText,
    translation: content.translation,
    explanation: content.explanation,
    sentence: content.sentence,
    deletedAt: content.hidden ?? row.deleted_at,
  };
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

async function updateSubtitleLineContent(
  subtitleLineId: string,
  updater: (content: Required<SubtitleLineContent>) => Required<SubtitleLineContent>
): Promise<void> {
  const db = new Database(await getDatabasePath());
  const rows = await db.select<{ content: string }[]>(
    'SELECT content FROM subtitle_lines WHERE id = ?',
    [subtitleLineId]
  );
  if (rows.length === 0) return;

  const parsed = parseSubtitleLineContent(rows[0].content);
  if (!parsed) {
    throw new Error(`Failed to parse subtitle line content for id: ${subtitleLineId}`);
  }
  const currentContent = normalizeSubtitleLineContent(parsed);
  const updatedContent = updater(currentContent);
  const now = new Date().toISOString();
  await db.execute('UPDATE subtitle_lines SET content = ?, updated_at = ? WHERE id = ?', [
    JSON.stringify(updatedContent),
    now,
    subtitleLineId,
  ]);
}

export const dialogueRepository = {
  async getDialogueById(dialogueId: string): Promise<SubtitleLine | null> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SubtitleLineRow[]>('SELECT * FROM subtitle_lines WHERE id = ?', [
      dialogueId,
    ]);
    return rows.length > 0 ? mapRowToSubtitleLine(rows[0]) : null;
  },

  async getDialoguesByEpisodeId(episodeId: string): Promise<readonly SubtitleLine[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SubtitleLineRow[]>(
      'SELECT * FROM subtitle_lines WHERE episode_id = ? ORDER BY sequence_number ASC',
      [episodeId]
    );
    return rows.map(mapRowToSubtitleLine);
  },

  async bulkInsertDialogues(
    episodeId: string,
    dialogues: readonly NewSubtitleLine[]
  ): Promise<void> {
    const db = new Database(await getDatabasePath());
    const sortedDialogues = [...dialogues].sort((a, b) => a.startTimeMs - b.startTimeMs);
    const now = new Date().toISOString();
    const values = sortedDialogues
      .map((d, index) => {
        const content = normalizeSubtitleLineContent({
          startTimeMs: d.startTimeMs,
          endTimeMs: d.endTimeMs,
          originalText: d.originalText,
          correctedText: null,
          translation: null,
          explanation: null,
          sentence: null,
          hidden: null,
        });
        return `('${uuidV4()}', '${escapeSqlString(episodeId)}', ${index + 1}, '${escapeSqlString(
          JSON.stringify(content)
        )}', '${now}', NULL)`;
      })
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO subtitle_lines (id, episode_id, sequence_number, content, updated_at, deleted_at) VALUES ${values}`;
    await db.execute(query);
  },

  async updateDialogueAnalysis(
    dialogueId: string,
    translation: string,
    explanation: string,
    sentence: string
  ): Promise<void> {
    await updateSubtitleLineContent(dialogueId, (content) => ({
      ...content,
      translation,
      explanation,
      sentence,
    }));
  },

  async deleteByEpisodeId(episodeId: string): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('DELETE FROM subtitle_lines WHERE episode_id = ?', [episodeId]);
  },

  async updateDialogueText(dialogueId: string, correctedText: string | null): Promise<void> {
    await updateSubtitleLineContent(dialogueId, (content) => ({
      ...content,
      correctedText,
    }));
  },

  async softDeleteDialogue(dialogueId: string): Promise<void> {
    const now = new Date().toISOString();
    await updateSubtitleLineContent(dialogueId, (content) => ({
      ...content,
      hidden: now,
    }));
  },

  async undoSoftDeleteDialogue(dialogueId: string): Promise<void> {
    await updateSubtitleLineContent(dialogueId, (content) => ({
      ...content,
      hidden: null,
    }));
  },
};
