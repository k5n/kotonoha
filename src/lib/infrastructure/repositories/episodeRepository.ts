import type { Episode } from '$lib/domain/entities/episode';
import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidV4 } from 'uuid';
import { getDatabasePath } from '../config';

type EpisodeRow = {
  id: string;
  episode_group_id: string;
  content: string;
  updated_at: string;
  deleted_at: string | null;
  sentence_card_count?: number;
};

type EpisodeContent = {
  title?: string;
  mediaPath?: string;
  learningLanguage?: string;
  explanationLanguage?: string;
  displayOrder?: number;
  createdAt?: string;
  [key: string]: unknown;
};

function parseEpisodeContent(content: string): EpisodeContent {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return parsed as EpisodeContent;
    }
  } catch {
    // ignore parsing errors and fall back to defaults
  }
  return {};
}

function mapRowToEpisode(row: EpisodeRow): Episode {
  const content = parseEpisodeContent(row.content);
  const createdAt = content.createdAt ?? row.updated_at;
  return {
    id: row.id,
    episodeGroupId: row.episode_group_id,
    displayOrder: typeof content.displayOrder === 'number' ? content.displayOrder : 0,
    title: typeof content.title === 'string' ? content.title : '',
    mediaPath: typeof content.mediaPath === 'string' ? content.mediaPath : '',
    learningLanguage:
      typeof content.learningLanguage === 'string' ? content.learningLanguage : 'English',
    explanationLanguage:
      typeof content.explanationLanguage === 'string' ? content.explanationLanguage : 'Japanese',
    updatedAt: new Date(row.updated_at),
    createdAt: new Date(createdAt),
    sentenceCardCount: row.sentence_card_count ?? 0,
    deletedAt: row.deleted_at,
  };
}

export const episodeRepository = {
  async getEpisodesWithCardCountByGroupId(groupId: string): Promise<readonly Episode[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeRow[]>(
      `
      SELECT
        e.id,
        e.episode_group_id,
        e.content,
        e.updated_at,
        e.deleted_at,
        COUNT(sc.id) AS sentence_card_count
      FROM episodes e
      LEFT JOIN subtitle_lines sl ON e.id = sl.episode_id
      LEFT JOIN sentence_cards sc ON sl.id = sc.subtitle_line_id AND sc.status = 'active'
      WHERE e.episode_group_id = ? AND e.deleted_at IS NULL
      GROUP BY e.id
      ORDER BY COALESCE(json_extract(e.content, '$.displayOrder'), 0) ASC
      `,
      [groupId]
    );
    return rows.map(mapRowToEpisode);
  },

  async getPartialEpisodesByGroupIds(
    groupIds: readonly string[]
  ): Promise<
    readonly { readonly id: string; readonly title: string; readonly mediaPath: string }[]
  > {
    if (groupIds.length === 0) return [];

    const db = new Database(await getDatabasePath());
    const placeholders = groupIds.map(() => '?').join(',');
    const rows = await db.select<{ id: string; content: string }[]>(
      `SELECT id, content FROM episodes WHERE episode_group_id IN (${placeholders}) AND deleted_at IS NULL`,
      [...groupIds]
    );
    return rows.map((row) => {
      const content = parseEpisodeContent(row.content);
      return {
        id: row.id,
        title: typeof content.title === 'string' ? content.title : '',
        mediaPath: typeof content.mediaPath === 'string' ? content.mediaPath : '',
      };
    });
  },

  async getEpisodeById(id: string): Promise<Episode | null> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeRow[]>(
      'SELECT id, episode_group_id, content, updated_at, deleted_at FROM episodes WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return mapRowToEpisode(rows[0]);
  },

  async addEpisode(params: {
    id?: string;
    episodeGroupId: string;
    displayOrder: number;
    title: string;
    mediaPath: string;
    learningLanguage: string;
    explanationLanguage: string;
  }): Promise<Episode> {
    const id = params.id ?? uuidV4();
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    const content = JSON.stringify({
      title: params.title,
      mediaPath: params.mediaPath,
      learningLanguage: params.learningLanguage,
      explanationLanguage: params.explanationLanguage,
      displayOrder: params.displayOrder,
      createdAt: now,
    });

    await db.execute(
      `INSERT INTO episodes (id, episode_group_id, content, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NULL)`,
      [id, params.episodeGroupId, content, now]
    );

    const newEpisode = await this.getEpisodeById(id);
    if (!newEpisode) {
      throw new Error('Failed to fetch the newly created episode.');
    }
    return newEpisode;
  },

  async updateEpisode(
    episodeId: string,
    params: { title?: string; displayOrder?: number }
  ): Promise<void> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<{ content: string }[]>(
      'SELECT content FROM episodes WHERE id = ?',
      [episodeId]
    );
    if (rows.length === 0) {
      throw new Error(`Episode not found: ${episodeId}`);
    }
    const currentContent = parseEpisodeContent(rows[0].content);
    const updatedContent = {
      ...currentContent,
      ...(params.title !== undefined ? { title: params.title } : {}),
      ...(params.displayOrder !== undefined ? { displayOrder: params.displayOrder } : {}),
    };
    const now = new Date().toISOString();
    await db.execute('UPDATE episodes SET content = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(updatedContent),
      now,
      episodeId,
    ]);
  },

  async deleteEpisode(episodeId: string): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('DELETE FROM episodes WHERE id = ?', [episodeId]);
  },

  async updateGroupId(episodeId: string, targetGroupId: string): Promise<void> {
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    await db.execute('UPDATE episodes SET episode_group_id = ?, updated_at = ? WHERE id = ?', [
      targetGroupId,
      now,
      episodeId,
    ]);
  },

  async updateOrders(episodes: readonly { id: string; display_order: number }[]): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('BEGIN TRANSACTION');
    try {
      const now = new Date().toISOString();
      for (const episode of episodes) {
        const rows = await db.select<{ content: string }[]>(
          'SELECT content FROM episodes WHERE id = ?',
          [episode.id]
        );
        if (rows.length === 0) continue;

        const content = parseEpisodeContent(rows[0].content);
        const newContent = { ...content, displayOrder: episode.display_order };
        await db.execute('UPDATE episodes SET content = ?, updated_at = ? WHERE id = ?', [
          JSON.stringify(newContent),
          now,
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
