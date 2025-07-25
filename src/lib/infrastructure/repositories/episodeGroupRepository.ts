import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import Database from '@tauri-apps/plugin-sql';
import { getDatabasePath } from '../config';

type EpisodeGroupRow = {
  id: number;
  name: string;
  display_order: number;
  parent_group_id: number | null;
  group_type: 'album' | 'folder';
};

// DBのsnake_caseカラム名をcamelCaseに変換し、EpisodeGroup型にマッピング
function mapRowToEpisodeGroup(row: EpisodeGroupRow): EpisodeGroup {
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
  async getAllGroups(): Promise<readonly EpisodeGroup[]> {
    const db = new Database(getDatabasePath());
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
    const db = new Database(getDatabasePath());
    await db.execute(
      `INSERT INTO episode_groups (name, parent_group_id, group_type, display_order)
      VALUES (?, ?, ?, ?)`,
      [params.name, params.parentId, params.groupType, params.displayOrder]
    );
    // SQLiteのlastInsertId取得
    const rows = await db.select(`SELECT last_insert_rowid() as id`);
    const [{ id }] = rows as { id: number }[];
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
  async updateGroupName(groupId: number, newName: string): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute(`UPDATE episode_groups SET name = ? WHERE id = ?`, [newName, groupId]);
  },

  /**
   * グループの親を更新する
   * @param groupId 対象グループID
   * @param newParentId 新しい親グループID (nullの場合はルート)
   */
  async updateGroupParent(groupId: number, newParentId: number | null): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('UPDATE episode_groups SET parent_group_id = ? WHERE id = ?', [
      newParentId,
      groupId,
    ]);
  },

  /**
   * 指定したIDのグループを取得する
   * @param groupId グループID
   * @returns EpisodeGroupオブジェクト、存在しない場合はnull
   */
  async getGroupById(groupId: number): Promise<EpisodeGroup | null> {
    const db = new Database(getDatabasePath());
    const rows = await db.select('SELECT * FROM episode_groups WHERE id = ?', [groupId]);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return mapRowToEpisodeGroup(rows[0] as EpisodeGroupRow);
  },

  /**
   * 指定したparentIdの子グループを取得する
   * @param parentId 親グループID（nullの場合はルート）
   * @returns 子グループの配列
   */
  async getGroups(parentId: number | null): Promise<readonly EpisodeGroup[]> {
    const db = new Database(getDatabasePath());
    let rows;
    if (parentId === null) {
      rows = await db.select(
        'SELECT * FROM episode_groups WHERE parent_group_id IS NULL ORDER BY display_order ASC'
      );
    } else {
      rows = await db.select(
        'SELECT * FROM episode_groups WHERE parent_group_id = ? ORDER BY display_order ASC',
        [parentId]
      );
    }
    if (!Array.isArray(rows)) throw new Error('DB returned non-array result');
    return rows.map(mapRowToEpisodeGroup);
  },

  /**
   * 種別が 'album' のグループをすべて取得する
   * @returns フラットなEpisodeGroupの配列
   */
  async findAlbumGroups(): Promise<readonly EpisodeGroup[]> {
    const db = new Database(getDatabasePath());
    const rows = await db.select<EpisodeGroupRow[]>(
      "SELECT * FROM episode_groups WHERE group_type = 'album'"
    );
    return rows.map(mapRowToEpisodeGroup);
  },

  /**
   * 複数のグループの表示順序を一括で更新する
   * @param groups グループIDと新しい表示順序のペアの配列
   */
  async updateOrders(groups: readonly { id: number; display_order: number }[]): Promise<void> {
    const db = new Database(getDatabasePath());
    await db.execute('BEGIN TRANSACTION');
    try {
      for (const group of groups) {
        await db.execute('UPDATE episode_groups SET display_order = ? WHERE id = ?', [
          group.display_order,
          group.id,
        ]);
      }
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  },
};
