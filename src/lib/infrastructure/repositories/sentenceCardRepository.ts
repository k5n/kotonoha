import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';
import { DB_NAME } from '../config';

function mapRowToSentenceCard(row: any): SentenceCard {
  return {
    id: row.id,
    dialogueId: row.dialogue_id,
    targetExpression: row.target_expression,
    sentence: row.sentence,
    definition: row.definition,
    status: row.status,
    createdAt: new Date(row.created_at),
    vocabulary: {
      id: row.vocabulary_id,
      expression: row.expression,
    },
  };
}

export const sentenceCardRepository = {
  /**
   * 新しいSentence Cardを追加する
   */
  async addSentenceCard(params: {
    dialogueId: number;
    vocabularyId: number;
    targetExpression: string;
    sentence: string;
    definition: string;
    status: 'active' | 'suspended';
  }): Promise<SentenceCard> {
    const db = new Database(DB_NAME);
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO sentence_cards (dialogue_id, vocabulary_id, target_expression, sentence, definition, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        params.dialogueId,
        params.vocabularyId,
        params.targetExpression,
        params.sentence,
        params.definition,
        params.status,
        now,
      ]
    );

    const rows = await db.select<{ id: number }[]>(`SELECT last_insert_rowid() as id`);
    const [{ id }] = rows;

    const newCard = await db.select<any[]>(
      'SELECT sc.*, v.expression FROM sentence_cards sc INNER JOIN vocabulary v ON sc.vocabulary_id = v.id WHERE sc.id = ?',
      [id]
    );
    return mapRowToSentenceCard(newCard[0]);
  },

  /**
   * 指定したエピソードIDに紐づく全てのSentence Cardを取得する
   */
  async getSentenceCardsByEpisodeId(episodeId: number): Promise<SentenceCard[]> {
    const db = new Database(DB_NAME);
    const rows = await db.select<any[]>(
      `
      SELECT
        sc.*,
        v.expression
      FROM sentence_cards sc
      INNER JOIN dialogues d ON sc.dialogue_id = d.id
      INNER JOIN vocabulary v ON sc.vocabulary_id = v.id
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
    const db = new Database(DB_NAME);
    await db.execute('UPDATE sentence_cards SET status = ? WHERE id = ?', [status, cardId]);
  },

  /**
   * Sentence Cardを削除する
   */
  async deleteSentenceCard(cardId: number): Promise<void> {
    const db = new Database(DB_NAME);
    await db.execute('DELETE FROM sentence_cards WHERE id = ?', [cardId]);
  },
};
