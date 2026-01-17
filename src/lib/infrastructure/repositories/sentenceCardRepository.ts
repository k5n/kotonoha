import type { SentenceAnalysisItem } from '$lib/domain/entities/sentenceAnalysisResult';
import type { SentenceCard, SentenceCardStatus } from '$lib/domain/entities/sentenceCard';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type SentenceCardRow = {
  id: string;
  subtitle_line_id: string;
  content: string;
  status: SentenceCardStatus;
  updated_at: string;
};

type SentenceCardContent = {
  partOfSpeech?: string;
  expression?: string;
  sentence?: string;
  contextualDefinition?: string;
  coreMeaning?: string;
  createdAt?: string;
};

function parseSentenceCardContent(raw: string): SentenceCardContent {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as SentenceCardContent;
    }
  } catch {
    // ignore parse errors
  }
  return {};
}

function mapRowToSentenceCard(row: SentenceCardRow): SentenceCard {
  const content = parseSentenceCardContent(row.content);
  const createdAt = content.createdAt ?? row.updated_at;
  return {
    id: row.id,
    subtitleLineId: row.subtitle_line_id,
    partOfSpeech: content.partOfSpeech ?? '',
    expression: content.expression ?? '',
    sentence: content.sentence ?? '',
    contextualDefinition: content.contextualDefinition ?? '',
    coreMeaning: content.coreMeaning ?? '',
    status: row.status,
    createdAt: new Date(createdAt),
  };
}

export const sentenceCardRepository = {
  // /**
  //  * 新しいSentence Cardを追加する
  //  */
  // async addSentenceCard(params: {
  //   subtitleLineId: string;
  //   partOfSpeech: string;
  //   expression: string;
  //   sentence: string;
  //   contextualDefinition: string;
  //   coreMeaning: string;
  //   status: 'active' | 'suspended';
  // }): Promise<SentenceCard> {
  //   const db = new Database(await getDatabasePath());
  //   const now = new Date().toISOString();
  //   const id = uuidV4();
  //   const content = JSON.stringify({
  //     partOfSpeech: params.partOfSpeech,
  //     expression: params.expression,
  //     sentence: params.sentence,
  //     contextualDefinition: params.contextualDefinition,
  //     coreMeaning: params.coreMeaning,
  //     createdAt: now,
  //   });
  //   await db.execute(
  //     `INSERT INTO sentence_cards (id, subtitle_line_id, content, status, updated_at)
  //     VALUES (?, ?, ?, ?, ?)`,
  //     [id, params.subtitleLineId, content, params.status, now]
  //   );

  //   const newCard = await db.select<SentenceCardRow[]>(
  //     'SELECT * FROM sentence_cards WHERE id = ?',
  //     [id]
  //   );
  //   return mapRowToSentenceCard(newCard[0]);
  // },

  /**
   * 指定したエピソードIDに紐づく全てのSentence Cardを取得する
   */
  async getSentenceCardsByEpisodeId(episodeId: string): Promise<readonly SentenceCard[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<SentenceCardRow[]>(
      `
      SELECT sc.*
      FROM sentence_cards sc
      INNER JOIN subtitle_lines sl ON sc.subtitle_line_id = sl.id
      WHERE sl.episode_id = ? AND sc.status = 'active'
      ORDER BY sl.sequence_number ASC, sc.updated_at ASC
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
      'SELECT * FROM sentence_cards WHERE subtitle_line_id = ? ORDER BY updated_at ASC',
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
      .map((item) => {
        const content = JSON.stringify({
          partOfSpeech: item.partOfSpeech,
          expression: item.expression,
          sentence: item.exampleSentence,
          contextualDefinition: item.contextualDefinition,
          coreMeaning: item.coreMeaning,
          createdAt: now,
        }).replace(/'/g, "''");
        return `('${item.id}', '${subtitleLineId.replace(/'/g, "''")}', '${content}', 'cache', '${now}')`;
      })
      .join(',');

    if (values.length === 0) return;

    const query = `INSERT INTO sentence_cards (id, subtitle_line_id, content, status, updated_at) VALUES ${values}`;
    await db.execute(query);
  },

  /**
   * キャッシュされたカードをアクティブにする
   */
  async activateCachedCards(cardIds: readonly string[]): Promise<void> {
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
  async updateSentenceCardStatus(cardId: string, status: SentenceCardStatus): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('UPDATE sentence_cards SET status = ? WHERE id = ?', [status, cardId]);
  },

  /**
   * Sentence Cardを削除する
   */
  async deleteSentenceCard(cardId: string): Promise<void> {
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
