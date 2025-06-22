import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import Database from '@tauri-apps/plugin-sql';

// DBのsnake_caseカラム名をcamelCaseに変換し、EpisodeGroup型にマッピング
function mapRowToEpisodeGroup(row: any): EpisodeGroup {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
    parentId: row.parent_group_id,
    groupType: row.group_type,
    children: [], // フラットで返す
  };
}

export const episodeGroupRepository = {
  /**
   * 全てのエピソードグループをフラットな配列で取得する
   *
   * 全てのEpisodeGroupのchildrenは空の配列であることに注意。
   * ツリー構造への組み立ては取得後に行う必要がある。
   */
  async getAllGroups(): Promise<EpisodeGroup[]> {
    const db = new Database('sqlite:app.db');
    const rows = await db.select('SELECT * FROM episode_groups');
    if (!Array.isArray(rows)) throw new Error('DB returned non-array result');
    return rows.map(mapRowToEpisodeGroup);
  },
};
