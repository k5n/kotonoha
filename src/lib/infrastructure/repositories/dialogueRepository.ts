import type { Dialogue } from '$lib/domain/entities/dialogue';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type DialogueRow = {
  id: number;
  episode_id: number;
  start_time_ms: number;
  end_time_ms: number;
  original_text: string;
  corrected_text: string | null;
  translation: string | null;
  explanation: string | null;
};

function mapRowToDialogue(row: DialogueRow): Dialogue {
  return {
    id: row.id,
    episodeId: row.episode_id,
    startTimeMs: row.start_time_ms,
    endTimeMs: row.end_time_ms,
    originalText: row.original_text,
    correctedText: row.corrected_text,
    translation: row.translation,
    explanation: row.explanation,
  };
}

export const dialogueRepository = {
  async getDialoguesByEpisodeId(episodeId: number): Promise<readonly Dialogue[]> {
    const db = new Database(getDatabasePath());
    const rows = await db.select<DialogueRow[]>(
      'SELECT * FROM dialogues WHERE episode_id = ? ORDER BY start_time_ms ASC',
      [episodeId]
    );
    return rows.map(mapRowToDialogue);
  },

  async bulkInsertDialogues(
    episodeId: number,
    dialogues: readonly Omit<Dialogue, 'id' | 'episodeId' | 'translation' | 'explanation'>[]
  ): Promise<void> {
    const db = new Database(getDatabasePath());
    const values = dialogues
      .map(
        (d) =>
          `(${episodeId}, ${d.startTimeMs}, ${d.endTimeMs}, '${d.originalText.replace(/'/g, "''")}', ${
            d.correctedText ? `'${d.correctedText.replace(/'/g, "''")}'` : 'NULL'
          })`
      )
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO dialogues (episode_id, start_time_ms, end_time_ms, original_text, corrected_text) VALUES ${values}`;
    await db.execute(query);
  },

  async updateDialogueAnalysis(
    dialogueId: number,
    translation: string,
    explanation: string
  ): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('UPDATE dialogues SET translation = ?, explanation = ? WHERE id = ?', [
      translation,
      explanation,
      dialogueId,
    ]);
  },
};
