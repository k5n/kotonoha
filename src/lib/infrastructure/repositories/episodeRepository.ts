import type { Episode } from '$lib/domain/entities/episode';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type EpisodeRow = {
  id: number;
  episode_group_id: string;
  display_order: number;
  title: string;
  media_path: string;
  learning_language: string;
  explanation_language: string;
  created_at: string;
  updated_at: string;
  sentence_card_count?: number;
};

function mapRowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    episodeGroupId: row.episode_group_id,
    displayOrder: row.display_order,
    title: row.title,
    mediaPath: row.media_path,
    learningLanguage: row.learning_language,
    explanationLanguage: row.explanation_language,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    sentenceCardCount: row.sentence_card_count || 0,
  };
}

export const episodeRepository = {
  async getEpisodesWithCardCountByGroupId(groupId: string): Promise<readonly Episode[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeRow[]>(
      `
      SELECT
        e.*,
        COUNT(sc.id) AS sentence_card_count
      FROM episodes e
      LEFT JOIN dialogues d ON e.id = d.episode_id
      LEFT JOIN sentence_cards sc ON d.id = sc.dialogue_id AND sc.status = 'active'
      WHERE e.episode_group_id = ?
      GROUP BY e.id
      ORDER BY e.display_order ASC
      `,
      [groupId]
    );
    return rows.map(mapRowToEpisode);
  },

  /**
   * 複数のグループIDに所属するすべてのエピソードの基本情報を一括で取得する（削除処理用）
   * @param groupIds 取得対象のグループIDの配列
   * @returns エピソードの基本情報（id, title, mediaPath）の配列
   */
  async getPartialEpisodesByGroupIds(
    groupIds: readonly string[]
  ): Promise<
    readonly { readonly id: number; readonly title: string; readonly mediaPath: string }[]
  > {
    if (groupIds.length === 0) {
      return [];
    }
    const db = new Database(await getDatabasePath());
    const placeholders = groupIds.map(() => '?').join(',');
    const rows = await db.select<{ id: number; title: string; media_path: string }[]>(
      `SELECT id, title, media_path FROM episodes WHERE episode_group_id IN (${placeholders})`,
      [...groupIds]
    );
    return rows.map((row) => ({ id: row.id, title: row.title, mediaPath: row.media_path }));
  },

  async getEpisodeById(id: number): Promise<Episode | null> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeRow[]>('SELECT * FROM episodes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return null;
    }
    return mapRowToEpisode(rows[0]);
  },

  async addEpisode(params: {
    episodeGroupId: string;
    displayOrder: number;
    title: string;
    mediaPath: string;
    learningLanguage: string;
    explanationLanguage: string;
  }): Promise<Episode> {
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO episodes (episode_group_id, display_order, title, media_path, learning_language, explanation_language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.episodeGroupId,
        params.displayOrder,
        params.title,
        params.mediaPath,
        params.learningLanguage,
        params.explanationLanguage,
        now,
        now,
      ]
    );

    const rows = await db.select<{ id: number }[]>(`SELECT last_insert_rowid() as id`);
    const [{ id }] = rows;

    const newEpisode = await this.getEpisodeById(id);
    if (!newEpisode) {
      throw new Error('Failed to fetch the newly created episode.');
    }
    return newEpisode;
  },

  async updateEpisode(
    episodeId: number,
    params: {
      title?: string;
      displayOrder?: number;
      episodeGroupId?: number;
    }
  ): Promise<void> {
    const db = new Database(await getDatabasePath());
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (params.title !== undefined) {
      updates.push('title = ?');
      values.push(params.title);
    }
    if (params.displayOrder !== undefined) {
      updates.push('display_order = ?');
      values.push(params.displayOrder);
    }
    if (params.episodeGroupId !== undefined) {
      updates.push('episode_group_id = ?');
      values.push(params.episodeGroupId);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(episodeId);

    await db.execute(`UPDATE episodes SET ${updates.join(', ')} WHERE id = ?`, values);
  },

  async deleteEpisode(episodeId: number): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('DELETE FROM episodes WHERE id = ?', [episodeId]);
  },

  async updateGroupId(episodeId: number, targetGroupId: string): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('UPDATE episodes SET episode_group_id = ? WHERE id = ?', [
      targetGroupId,
      episodeId,
    ]);
  },

  /**
   * 複数のエピソードの表示順序を一括で更新する
   * @param episodes エピソードIDと新しい表示順序のペアの配列
   */
  async updateOrders(episodes: readonly { id: number; display_order: number }[]): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('BEGIN TRANSACTION');
    try {
      for (const episode of episodes) {
        await db.execute('UPDATE episodes SET display_order = ? WHERE id = ?', [
          episode.display_order,
          episode.id,
        ]);
      }
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  },
};
