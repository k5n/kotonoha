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
};

type SubtitleLineContent = {
  id?: string;
  episode_id?: string;
  sequence_number?: number;
  start_time_ms?: number;
  end_time_ms?: number | null;
  original_text?: string;
  corrected_text?: string | null;
  translation?: string | null;
  explanation?: string | null;
  sentence?: string | null;
  hidden?: boolean;
  updated_at?: string;
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
    id: typeof content.id === 'string' ? content.id : '',
    episode_id: typeof content.episode_id === 'string' ? content.episode_id : '',
    sequence_number: typeof content.sequence_number === 'number' ? content.sequence_number : 0,
    start_time_ms: typeof content.start_time_ms === 'number' ? content.start_time_ms : 0,
    end_time_ms: typeof content.end_time_ms === 'number' ? content.end_time_ms : null,
    original_text: typeof content.original_text === 'string' ? content.original_text : '',
    corrected_text: typeof content.corrected_text === 'string' ? content.corrected_text : null,
    translation: typeof content.translation === 'string' ? content.translation : null,
    explanation: typeof content.explanation === 'string' ? content.explanation : null,
    sentence: typeof content.sentence === 'string' ? content.sentence : null,
    hidden: typeof content.hidden === 'boolean' ? content.hidden : false,
    updated_at: typeof content.updated_at === 'string' ? content.updated_at : '',
  };
}

function mapRowToSubtitleLine(row: SubtitleLineRow): SubtitleLine {
  const content = normalizeSubtitleLineContent(parseSubtitleLineContent(row.content) ?? {});
  return {
    id: content.id,
    episodeId: content.episode_id,
    sequenceNumber: content.sequence_number,
    startTimeMs: content.start_time_ms,
    endTimeMs: content.end_time_ms,
    originalText: content.original_text,
    correctedText: content.corrected_text,
    translation: content.translation,
    explanation: content.explanation,
    sentence: content.sentence,
    hidden: content.hidden,
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
    JSON.stringify({ ...updatedContent, updated_at: now }),
    now,
    subtitleLineId,
  ]);
}

export const subtitleLineRepository = {
  async getSubtitleLineById(subtitleLineId: string): Promise<SubtitleLine | null> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SubtitleLineRow[]>('SELECT * FROM subtitle_lines WHERE id = ?', [
      subtitleLineId,
    ]);
    return rows.length > 0 ? mapRowToSubtitleLine(rows[0]) : null;
  },

  async getSubtitleLinesByEpisodeId(episodeId: string): Promise<readonly SubtitleLine[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SubtitleLineRow[]>(
      'SELECT * FROM subtitle_lines WHERE episode_id = ? ORDER BY sequence_number ASC',
      [episodeId]
    );
    return rows.map(mapRowToSubtitleLine);
  },

  async bulkInsertSubtitleLines(
    episodeId: string,
    subtitleLines: readonly NewSubtitleLine[]
  ): Promise<void> {
    const db = new Database(await getDatabasePath());
    const sortedSubtitleLines = [...subtitleLines].sort((a, b) => a.startTimeMs - b.startTimeMs);
    const now = new Date().toISOString();
    const values = sortedSubtitleLines
      .map((d, index) => {
        const id = uuidV4();
        const content = normalizeSubtitleLineContent({
          id,
          episode_id: episodeId,
          sequence_number: index + 1,
          start_time_ms: d.startTimeMs,
          end_time_ms: d.endTimeMs,
          original_text: d.originalText,
          corrected_text: null,
          translation: null,
          explanation: null,
          sentence: null,
          hidden: false,
          updated_at: now,
        });
        return `('${id}', '${escapeSqlString(episodeId)}', ${index + 1}, '${escapeSqlString(
          JSON.stringify(content)
        )}', '${now}')`;
      })
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO subtitle_lines (id, episode_id, sequence_number, content, updated_at) VALUES ${values}`;
    await db.execute(query);
  },

  async updateSubtitleLineAnalysis(
    subtitleLineId: string,
    translation: string,
    explanation: string,
    sentence: string
  ): Promise<void> {
    await updateSubtitleLineContent(subtitleLineId, (content) => ({
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

  async updateSubtitleLineText(
    subtitleLineId: string,
    correctedText: string | null
  ): Promise<void> {
    await updateSubtitleLineContent(subtitleLineId, (content) => ({
      ...content,
      corrected_text: correctedText,
    }));
  },

  async softDeleteSubtitleLine(subtitleLineId: string): Promise<void> {
    await updateSubtitleLineContent(subtitleLineId, (content) => ({
      ...content,
      hidden: true,
    }));
  },

  async undoSoftDeleteSubtitleLine(subtitleLineId: string): Promise<void> {
    await updateSubtitleLineContent(subtitleLineId, (content) => ({
      ...content,
      hidden: false,
    }));
  },
};
