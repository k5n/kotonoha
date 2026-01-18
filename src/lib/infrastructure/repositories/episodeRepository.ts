import type { Episode } from '$lib/domain/entities/episode';
import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidV4 } from 'uuid';
import { getDatabasePath } from '../config';

type EpisodeRow = {
  id: string;
  episode_group_id: string;
  content: string;
  updated_at: string;
  sentence_card_count?: number;
};

type EpisodeContent = {
  id?: string;
  episode_group_id?: string;
  display_order?: number;
  title?: string;
  media_path?: string;
  learning_language?: string;
  explanation_language?: string;
  created_at?: string;
  updated_at?: string;
  sentence_card_count?: number;
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
  const createdAt = content.created_at ?? '';
  const updatedAt = content.updated_at ?? '';
  return {
    id: typeof content.id === 'string' ? content.id : '',
    episodeGroupId: typeof content.episode_group_id === 'string' ? content.episode_group_id : '',
    displayOrder: typeof content.display_order === 'number' ? content.display_order : 0,
    title: typeof content.title === 'string' ? content.title : '',
    mediaPath: typeof content.media_path === 'string' ? content.media_path : '',
    learningLanguage:
      typeof content.learning_language === 'string' ? content.learning_language : 'English',
    explanationLanguage:
      typeof content.explanation_language === 'string' ? content.explanation_language : 'Japanese',
    updatedAt: new Date(updatedAt || new Date().toISOString()),
    createdAt: new Date(createdAt || new Date().toISOString()),
    sentenceCardCount:
      typeof content.sentence_card_count === 'number' ? content.sentence_card_count : 0,
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
        json_set(e.content, '$.sentence_card_count', COUNT(sc.id)) AS content,
        e.updated_at,
        COUNT(sc.id) AS sentence_card_count
      FROM episodes e
      LEFT JOIN subtitle_lines sl ON e.id = sl.episode_id
      LEFT JOIN sentence_cards sc ON sl.id = sc.subtitle_line_id AND sc.status = 'active'
      WHERE e.episode_group_id = ?
      GROUP BY e.id
      ORDER BY COALESCE(json_extract(e.content, '$.display_order'), 0) ASC
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
      `SELECT id, content FROM episodes WHERE episode_group_id IN (${placeholders})`,
      [...groupIds]
    );
    return rows.map((row) => {
      const content = parseEpisodeContent(row.content);
      return {
        id: typeof content.id === 'string' ? content.id : '',
        title: typeof content.title === 'string' ? content.title : '',
        mediaPath: typeof content.media_path === 'string' ? content.media_path : '',
      };
    });
  },

  async getEpisodeById(id: string): Promise<Episode | null> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeRow[]>(
      'SELECT id, episode_group_id, content, updated_at FROM episodes WHERE id = ?',
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
      id,
      episode_group_id: params.episodeGroupId,
      title: params.title,
      media_path: params.mediaPath,
      learning_language: params.learningLanguage,
      explanation_language: params.explanationLanguage,
      display_order: params.displayOrder,
      created_at: now,
      updated_at: now,
    });

    await db.execute(
      `INSERT INTO episodes (id, episode_group_id, content, updated_at)
       VALUES (?, ?, ?, ?)`,
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
      ...(params.displayOrder !== undefined ? { display_order: params.displayOrder } : {}),
    };
    const now = new Date().toISOString();
    await db.execute('UPDATE episodes SET content = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify({ ...updatedContent, updated_at: now }),
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
    const rows = await db.select<{ content: string }[]>(
      'SELECT content FROM episodes WHERE id = ?',
      [episodeId]
    );
    if (rows.length === 0) {
      throw new Error(`Episode not found: ${episodeId}`);
    }
    const currentContent = parseEpisodeContent(rows[0].content);
    const now = new Date().toISOString();
    await db.execute('UPDATE episodes SET episode_group_id = ?, updated_at = ? WHERE id = ?', [
      targetGroupId,
      now,
      episodeId,
    ]);
    const updatedContent = JSON.stringify({
      ...currentContent,
      episode_group_id: targetGroupId,
      updated_at: now,
    });
    await db.execute('UPDATE episodes SET content = ? WHERE id = ?', [updatedContent, episodeId]);
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
        const newContent = { ...content, display_order: episode.display_order };
        await db.execute('UPDATE episodes SET content = ?, updated_at = ? WHERE id = ?', [
          JSON.stringify({ ...newContent, updated_at: now }),
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
