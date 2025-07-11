import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type SentenceCardRow = {
  id: number;
  dialogue_id: number;
  expression: string;
  sentence: string;
  definition: string;
  status: 'active' | 'suspended';
  created_at: string;
};

function mapRowToSentenceCard(row: SentenceCardRow): SentenceCard {
  return {
    id: row.id,
    dialogueId: row.dialogue_id,
    expression: row.expression,
    sentence: row.sentence,
    definition: row.definition,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export const sentenceCardRepository = {
  /**
   * 新しいSentence Cardを追加する
   */
  async addSentenceCard(params: {
    dialogueId: number;
    expression: string;
    sentence: string;
    definition: string;
    status: 'active' | 'suspended';
  }): Promise<SentenceCard> {
    const db = new Database(getDatabasePath());
    const now = new Date().toISOString();
    const result = await db.execute(
      `INSERT INTO sentence_cards (dialogue_id, expression, sentence, definition, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [params.dialogueId, params.expression, params.sentence, params.definition, params.status, now]
    );

    const newCard = await db.select<SentenceCardRow[]>(
      'SELECT * FROM sentence_cards WHERE id = ?',
      [result.lastInsertId]
    );
    return mapRowToSentenceCard(newCard[0]);
  },

  /**
   * 指定したエピソードIDに紐づく全てのSentence Cardを取得する
   */
  async getSentenceCardsByEpisodeId(episodeId: number): Promise<readonly SentenceCard[]> {
    const db = new Database(getDatabasePath());
    const rows = await db.select<SentenceCardRow[]>(
      `
      SELECT
        sc.*
      FROM sentence_cards sc
      INNER JOIN dialogues d ON sc.dialogue_id = d.id
      WHERE d.episode_id = ?
      ORDER BY d.start_time_ms ASC, sc.created_at ASC
    `,
      [episodeId]
    );
    return rows.map(mapRowToSentenceCard);
  },

  /**
   * Sentence Cardのステータスを更新する
   */
  async updateSentenceCardStatus(cardId: number, status: 'active' | 'suspended'): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('UPDATE sentence_cards SET status = ? WHERE id = ?', [status, cardId]);
  },

  /**
   * Sentence Cardを削除する
   */
  async deleteSentenceCard(cardId: number): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('DELETE FROM sentence_cards WHERE id = ?', [cardId]);
  },
};
