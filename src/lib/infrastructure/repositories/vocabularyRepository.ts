import type { Vocabulary } from '$lib/domain/entities/vocabulary';
import Database from '@tauri-apps/plugin-sql';
import { DB_NAME } from '../config';

export const vocabularyRepository = {
  /**
   * 表現（単語・イディオム）を検索し、存在しない場合は追加する
   * @param expression 検索または追加する表現
   * @returns 該当するVocabularyオブジェクト
   */
  async findOrAddVocabulary(expression: string): Promise<Vocabulary> {
    const db = new Database(DB_NAME);

    // 既存の表現を検索
    const existing = await db.select<Vocabulary[]>(
      'SELECT * FROM vocabulary WHERE expression = ?',
      [expression]
    );

    if (existing.length > 0) {
      return existing[0];
    }

    // 新しい表現を追加
    await db.execute('INSERT INTO vocabulary (expression) VALUES (?)', [expression]);

    // 追加したレコードのIDを取得
    const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() as id');
    const [{ id }] = rows;

    return { id, expression };
  },
};
