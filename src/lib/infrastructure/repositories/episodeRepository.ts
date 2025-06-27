import type { Episode } from '$lib/domain/entities/episode';
import Database from '@tauri-apps/plugin-sql';
import { DB_NAME } from '../config';

function mapRowToEpisode(row: any): Episode {
  return {
    id: row.id,
    episodeGroupId: row.episode_group_id,
    displayOrder: row.display_order,
    title: row.title,
    audioPath: row.audio_path,
    durationSeconds: row.duration_seconds,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    dialogues: [], // dialoguesは別途取得するため、ここでは空配列をセット
  };
}

export const episodeRepository = {
  async getEpisodesByGroupId(groupId: number): Promise<Episode[]> {
    const db = new Database(DB_NAME);
    const rows = await db.select(
      'SELECT * FROM episodes WHERE episode_group_id = ? ORDER BY display_order ASC',
      [groupId]
    );
    if (!Array.isArray(rows)) throw new Error('DB returned non-array result');
    return rows.map(mapRowToEpisode);
  },

  async addEpisode(params: {
    episodeGroupId: number;
    displayOrder: number;
    title: string;
    audioPath: string;
    scriptPath: string;
    durationSeconds: number | null;
  }): Promise<Episode> {
    const db = new Database(DB_NAME);
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO episodes (episode_group_id, display_order, title, audio_path, script_path, duration_seconds, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.episodeGroupId,
        params.displayOrder,
        params.title,
        params.audioPath,
        params.scriptPath,
        params.durationSeconds,
        now,
        now,
      ]
    );

    const rows = await db.select(`SELECT last_insert_rowid() as id`);
    const [{ id }] = rows as any[];

    const newEpisode = await db.select('SELECT * FROM episodes WHERE id = ?', [id]);
    return mapRowToEpisode((newEpisode as any[])[0]);
  },

  async updateEpisode(
    episodeId: number,
    params: {
      title?: string;
      displayOrder?: number;
      episodeGroupId?: number;
    }
  ): Promise<void> {
    const db = new Database(DB_NAME);
    const updates: string[] = [];
    const values: any[] = [];

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
    const db = new Database(DB_NAME);
    await db.execute('DELETE FROM episodes WHERE id = ?', [episodeId]);
  },
};
