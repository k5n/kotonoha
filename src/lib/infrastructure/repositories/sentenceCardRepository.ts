import type { SentenceAnalysisItem } from '$lib/domain/entities/sentenceAnalysisResult';
import type { SentenceCard, SentenceCardStatus } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type SentenceCardRow = {
  id: number;
  dialogue_id: number;
  part_of_speech: string;
  expression: string;
  sentence: string;
  contextual_definition: string;
  core_meaning: string;
  status: SentenceCardStatus;
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

export const sentenceCardRepository = {
  /**
   * 新しいSentence Cardを追加する
   */
  async addSentenceCard(params: {
    dialogueId: number;
    partOfSpeech: string;
    expression: string;
    sentence: string;
    contextualDefinition: string;
    coreMeaning: string;
    status: 'active' | 'suspended';
  }): Promise<SentenceCard> {
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    const result = await db.execute(
      `INSERT INTO sentence_cards (dialogue_id, part_of_speech, expression, sentence, contextual_definition, core_meaning, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.dialogueId,
        params.partOfSpeech,
        params.expression,
        params.sentence,
        params.contextualDefinition,
        params.coreMeaning,
        params.status,
        now,
      ]
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
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SentenceCardRow[]>(
      `
      SELECT
        sc.*
      FROM sentence_cards sc
      INNER JOIN dialogues d ON sc.dialogue_id = d.id
      WHERE d.episode_id = ? AND sc.status = 'active'
      ORDER BY d.start_time_ms ASC, sc.created_at ASC
    `,
      [episodeId]
    );
    return rows.map(mapRowToSentenceCard);
  },

  /**
   * 指定したダイアログIDに紐づく全てのSentence Cardを取得する
   */
  async getSentenceCardsByDialogueId(dialogueId: number): Promise<readonly SentenceCard[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SentenceCardRow[]>(
      'SELECT * FROM sentence_cards WHERE dialogue_id = ? ORDER BY created_at ASC',
      [dialogueId]
    );
    return rows.map(mapRowToSentenceCard);
  },

  /**
   * LLMの解析結果をキャッシュとして保存する
   */
  async cacheAnalysisItems(
    dialogueId: number,
    items: readonly SentenceAnalysisItem[]
  ): Promise<void> {
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    const values = items
      .map(
        (item) =>
          `(${dialogueId}, '${item.partOfSpeech.replace(/'/g, "''")}', '${item.expression.replace(/'/g, "''")}', '${item.exampleSentence.replace(/'/g, "''")}', '${item.contextualDefinition.replace(/'/g, "''")}', '${item.coreMeaning.replace(/'/g, "''")}', 'cache', '${now}')`
      )
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO sentence_cards (dialogue_id, part_of_speech, expression, sentence, contextual_definition, core_meaning, status, created_at) VALUES ${values}`;
    await db.execute(query);
  },

  /**
   * キャッシュされたカードをアクティブにする
   */
  async activateCachedCards(cardIds: readonly number[]): Promise<void> {
    if (cardIds.length === 0) return;
    const db = new Database(await getDatabasePath());
    const placeholders = cardIds.map(() => '?').join(',');
    await db.execute(`UPDATE sentence_cards SET status = 'active' WHERE id IN (${placeholders})`, [
      ...cardIds,
    ]);
  },

  /**
   * Sentence Cardのステータスを更新する
   */
  async updateSentenceCardStatus(cardId: number, status: SentenceCardStatus): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('UPDATE sentence_cards SET status = ? WHERE id = ?', [status, cardId]);
  },

  /**
   * Sentence Cardを削除する
   */
  async deleteSentenceCard(cardId: number): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('DELETE FROM sentence_cards WHERE id = ?', [cardId]);
  },

  /**
   * 指定したエピソードIDに紐づく全てのSentence Cardを削除する
   */
  async deleteByEpisodeId(episodeId: number): Promise<void> {
    const db = new Database(await getDatabasePath());
    const dialogueIds = await db.select<{ id: number }[]>(
      'SELECT id FROM dialogues WHERE episode_id = ?',
      [episodeId]
    );
    if (dialogueIds.length === 0) {
      return;
    }
    const ids = dialogueIds.map((d) => d.id);
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`DELETE FROM sentence_cards WHERE dialogue_id IN (${placeholders})`, ids);
  },
};
