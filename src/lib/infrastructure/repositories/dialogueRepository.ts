import type { Dialogue } from '$lib/domain/entities/dialogue';
import Database from '@tauri-apps/plugin-sql';
import { DB_NAME } from '../config';

type DialogueRow = {
  id: number;
  episode_id: number;
  start_time_ms: number;
  end_time_ms: number;
  original_text: string;
  corrected_text: string | null;
};

function mapRowToDialogue(row: DialogueRow): Dialogue {
  return {
    id: row.id,
    episodeId: row.episode_id,
    startTimeMs: row.start_time_ms,
    endTimeMs: row.end_time_ms,
    originalText: row.original_text,
    correctedText: row.corrected_text,
  };
}

export const dialogueRepository = {
  async getDialoguesByEpisodeId(episodeId: number): Promise<Dialogue[]> {
    const db = new Database(DB_NAME);
    const rows = await db.select(
      'SELECT * FROM dialogues WHERE episode_id = ? ORDER BY start_time_ms ASC',
      [episodeId]
    );
    if (!Array.isArray(rows)) throw new Error('DB returned non-array result');
    return rows.map(mapRowToDialogue);
  },

  async bulkInsertDialogues(
    episodeId: number,
    dialogues: Omit<Dialogue, 'id' | 'episodeId'>[]
  ): Promise<void> {
    const db = new Database(DB_NAME);
    const values = dialogues
      .map(
        (d) =>
          `(${episodeId}, ${d.startTimeMs}, ${d.endTimeMs}, '${d.originalText.replace(/'/g, "''")}', ${d.correctedText ? `'${d.correctedText.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO dialogues (episode_id, start_time_ms, end_time_ms, original_text, corrected_text) VALUES ${values}`;
    await db.execute(query);
  },
};
