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
  id: string;
  episodeGroupId: string;
  displayOrder: number;
  title: string;
  mediaPath: string;
  learningLanguage: string;
  explanationLanguage: string;
  createdAt: string;
  updatedAt: string;
  sentenceCardCount?: number;
  [key: string]: unknown;
};

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid episode content: ${field}`);
  }
  return value;
}

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== 'number') {
    throw new Error(`Invalid episode content: ${field}`);
  }
  return value;
}

function parseOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number') {
    throw new Error(`Invalid episode content: ${field}`);
  }
  return value;
}

function parseEpisodeContent(content: string): EpisodeContent {
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid episode content: root');
  }
  const record = parsed as Record<string, unknown>;
  return {
    id: assertString(record.id, 'id'),
    episodeGroupId: assertString(record.episodeGroupId, 'episodeGroupId'),
    displayOrder: assertNumber(record.displayOrder, 'displayOrder'),
    title: assertString(record.title, 'title'),
    mediaPath: assertString(record.mediaPath, 'mediaPath'),
    learningLanguage: assertString(record.learningLanguage, 'learningLanguage'),
    explanationLanguage: assertString(record.explanationLanguage, 'explanationLanguage'),
    createdAt: assertString(record.createdAt, 'createdAt'),
    updatedAt: assertString(record.updatedAt, 'updatedAt'),
    sentenceCardCount: parseOptionalNumber(record.sentenceCardCount, 'sentenceCardCount'),
    ...record,
  };
}

function mapRowToEpisode(row: EpisodeRow): Episode {
  const content = parseEpisodeContent(row.content);
  const createdAt = content.createdAt;
  const updatedAt = content.updatedAt;
  return {
    id: content.id,
    episodeGroupId: content.episodeGroupId,
    displayOrder: content.displayOrder,
    title: content.title,
    mediaPath: content.mediaPath,
    learningLanguage: content.learningLanguage,
    explanationLanguage: content.explanationLanguage,
    updatedAt: new Date(updatedAt || new Date().toISOString()),
    createdAt: new Date(createdAt || new Date().toISOString()),
    sentenceCardCount: content.sentenceCardCount ?? 0,
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
        json_set(e.content, '$.sentenceCardCount', COUNT(sc.id)) AS content,
        e.updated_at,
        COUNT(sc.id) AS sentence_card_count
      FROM episodes e
      LEFT JOIN subtitle_lines sl ON e.id = sl.episode_id
      LEFT JOIN sentence_cards sc ON sl.id = sc.subtitle_line_id AND sc.status = 'active'
      WHERE e.episode_group_id = ?
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
      `SELECT id, content FROM episodes WHERE episode_group_id IN (${placeholders})`,
      [...groupIds]
    );
    return rows.map((row) => {
      const content = parseEpisodeContent(row.content);
      return {
        id: content.id,
        title: content.title ?? '',
        mediaPath: content.mediaPath,
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
      episodeGroupId: params.episodeGroupId,
      title: params.title,
      mediaPath: params.mediaPath,
      learningLanguage: params.learningLanguage,
      explanationLanguage: params.explanationLanguage,
      displayOrder: params.displayOrder,
      createdAt: now,
      updatedAt: now,
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
      ...(params.displayOrder !== undefined ? { displayOrder: params.displayOrder } : {}),
    };
    const now = new Date().toISOString();
    await db.execute('UPDATE episodes SET content = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify({ ...updatedContent, updatedAt: now }),
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
      episodeGroupId: targetGroupId,
      updatedAt: now,
    });
    await db.execute('UPDATE episodes SET content = ? WHERE id = ?', [updatedContent, episodeId]);
  },

  async updateOrders(episodes: readonly { id: string; displayOrder: number }[]): Promise<void> {
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
        const newContent = { ...content, displayOrder: episode.displayOrder };
        await db.execute('UPDATE episodes SET content = ?, updated_at = ? WHERE id = ?', [
          JSON.stringify({ ...newContent, updatedAt: now }),
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
