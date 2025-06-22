import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import Database from '@tauri-apps/plugin-sql';

const DB_NAME = 'sqlite:app.db';

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
    const db = new Database(DB_NAME);
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
    const db = new Database(DB_NAME);
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

  /**
   * グループ名を更新する
   * @param groupId 対象グループID
   * @param newName 新しいグループ名
   */
  async updateGroup(groupId: number, newName: string): Promise<void> {
    const db = new Database(DB_NAME);
    await db.execute(`UPDATE episode_groups SET name = ? WHERE id = ?`, [newName, groupId]);
  },

  // /**
  //  * 指定したparentIdの子グループを取得する
  //  * @param parentId 親グループID（nullの場合はルート）
  //  * @returns 子グループの配列
  //  */
  // async getGroups(parentId: number | null): Promise<EpisodeGroup[]> {
  //   const db = new Database(DB_NAME);
  //   let rows;
  //   if (parentId === null) {
  //     rows = await db.select('SELECT * FROM episode_groups WHERE parent_group_id IS NULL');
  //   } else {
  //     rows = await db.select('SELECT * FROM episode_groups WHERE parent_group_id = ?', [parentId]);
  //   }
  //   if (!Array.isArray(rows)) throw new Error('DB returned non-array result');
  //   return rows.map(mapRowToEpisodeGroup);
  // },
};
