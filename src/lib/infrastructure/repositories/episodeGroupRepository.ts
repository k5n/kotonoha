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

  /**
   * 新しいエピソードグループを追加する
   * @param params グループ名・親ID・種別・表示順
   * @returns 追加されたEpisodeGroup
   */
  async addGroup(params: {
    name: string;
    parentId: number | null;
    groupType: 'album' | 'folder';
    displayOrder: number;
  }): Promise<EpisodeGroup> {
    const db = new Database('sqlite:app.db');
    await db.execute(
      `INSERT INTO episode_groups (name, parent_group_id, group_type, display_order)
      VALUES (?, ?, ?, ?)`,
      [params.name, params.parentId, params.groupType, params.displayOrder]
    );
    // SQLiteのlastInsertId取得
    const rows = await db.select(`SELECT last_insert_rowid() as id`);
    const [{ id }] = rows as any[];
    return {
      id,
      name: params.name,
      displayOrder: params.displayOrder,
      parentId: params.parentId,
      groupType: params.groupType,
      children: [],
    };
  },
};
