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

type SubtitleLineContent = SubtitleLine & {
  updatedAt: string;
};

function parseSubtitleLineContent(raw: string): SubtitleLineContent {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid subtitle line content: root');
  }
  return parsed as SubtitleLineContent;
}

function mapRowToSubtitleLine(row: SubtitleLineRow): SubtitleLine {
  const content = parseSubtitleLineContent(row.content);
  return content;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

async function updateSubtitleLineContent(
  subtitleLineId: string,
  updater: (content: SubtitleLineContent) => SubtitleLineContent
): Promise<void> {
  const db = new Database(await getDatabasePath());
  const rows = await db.select<{ content: string }[]>(
    'SELECT content FROM subtitle_lines WHERE id = ?',
    [subtitleLineId]
  );
  if (rows.length === 0) return;

  const currentContent = parseSubtitleLineContent(rows[0].content);
  const updatedContent = updater(currentContent);
  const now = new Date().toISOString();
  await db.execute('UPDATE subtitle_lines SET content = ?, updated_at = ? WHERE id = ?', [
    JSON.stringify({ ...updatedContent, updatedAt: now }),
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
        const content: SubtitleLineContent = {
          id,
          episodeId,
          sequenceNumber: index + 1,
          startTimeMs: d.startTimeMs,
          endTimeMs: d.endTimeMs,
          originalText: d.originalText,
          correctedText: null,
          translation: null,
          explanation: null,
          sentence: null,
          hidden: false,
          updatedAt: now,
        };
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
      correctedText,
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
