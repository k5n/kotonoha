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
  deleted_at: string | null;
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
    deleted_at: row.deleted_at,
  };
}

export const dialogueRepository = {
  async getDialogueById(dialogueId: number): Promise<Dialogue | null> {
    const db = new Database(getDatabasePath());
    const rows = await db.select<DialogueRow[]>('SELECT * FROM dialogues WHERE id = ?', [
      dialogueId,
    ]);
    return rows.length > 0 ? mapRowToDialogue(rows[0]) : null;
  },

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
    dialogues: readonly Omit<
      Dialogue,
      'id' | 'episodeId' | 'translation' | 'explanation' | 'deleted_at'
    >[]
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

  async deleteByEpisodeId(episodeId: number): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('DELETE FROM dialogues WHERE episode_id = ?', [episodeId]);
  },

  async updateDialogueText(dialogueId: number, correctedText: string | null): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('UPDATE dialogues SET corrected_text = ? WHERE id = ?', [
      correctedText,
      dialogueId,
    ]);
  },

  async softDeleteDialogue(dialogueId: number): Promise<void> {
    const db = new Database(getDatabasePath());
    const now = new Date().toISOString();
    await db.execute('UPDATE dialogues SET deleted_at = ? WHERE id = ?', [now, dialogueId]);
  },

  async undoSoftDeleteDialogue(dialogueId: number): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('UPDATE dialogues SET deleted_at = NULL WHERE id = ?', [dialogueId]);
  },
};
