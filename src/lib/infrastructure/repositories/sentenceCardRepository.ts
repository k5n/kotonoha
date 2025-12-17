import type { SentenceAnalysisItem } from '$lib/domain/entities/sentenceAnalysisResult';
import type { SentenceCard, SentenceCardStatus } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type SentenceCardRow = {
  id: number;
  subtitle_line_id: string;
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
    subtitleLineId: row.subtitle_line_id,
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
    subtitleLineId: string;
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
      `INSERT INTO sentence_cards (subtitle_line_id, part_of_speech, expression, sentence, contextual_definition, core_meaning, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.subtitleLineId,
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
  async getSentenceCardsByEpisodeId(episodeId: string): Promise<readonly SentenceCard[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SentenceCardRow[]>(
      `
      SELECT
        sc.*
      FROM sentence_cards sc
      INNER JOIN subtitle_lines sl ON sc.subtitle_line_id = sl.id
      WHERE sl.episode_id = ? AND sc.status = 'active'
      ORDER BY sl.sequence_number ASC, sc.created_at ASC
    `,
      [episodeId]
    );
    return rows.map(mapRowToSentenceCard);
  },

  /**
   * 指定したダイアログIDに紐づく全てのSentence Cardを取得する
   */
  async getSentenceCardsBySubtitleLineId(subtitleLineId: string): Promise<readonly SentenceCard[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SentenceCardRow[]>(
      'SELECT * FROM sentence_cards WHERE subtitle_line_id = ? ORDER BY created_at ASC',
      [subtitleLineId]
    );
    return rows.map(mapRowToSentenceCard);
  },

  /**
   * LLMの解析結果をキャッシュとして保存する
   */
  async cacheAnalysisItems(
    subtitleLineId: string,
    items: readonly SentenceAnalysisItem[]
  ): Promise<void> {
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    const values = items
      .map(
        (item) =>
          `('${subtitleLineId.replace(/'/g, "''")}', '${item.partOfSpeech.replace(/'/g, "''")}', '${item.expression.replace(/'/g, "''")}', '${item.exampleSentence.replace(/'/g, "''")}', '${item.contextualDefinition.replace(/'/g, "''")}', '${item.coreMeaning.replace(/'/g, "''")}', 'cache', '${now}')`
      )
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO sentence_cards (subtitle_line_id, part_of_speech, expression, sentence, contextual_definition, core_meaning, status, created_at) VALUES ${values}`;
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
  async deleteByEpisodeId(episodeId: string): Promise<void> {
    const db = new Database(await getDatabasePath());
    const subtitleLineIds = await db.select<{ id: string }[]>(
      'SELECT id FROM subtitle_lines WHERE episode_id = ?',
      [episodeId]
    );
    if (subtitleLineIds.length === 0) {
      return;
    }
    const ids = subtitleLineIds.map((d) => d.id);
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`DELETE FROM sentence_cards WHERE subtitle_line_id IN (${placeholders})`, ids);
  },
};
