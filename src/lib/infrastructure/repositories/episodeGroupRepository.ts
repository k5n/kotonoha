import type { EpisodeGroup, EpisodeGroupType } from '$lib/domain/entities/episodeGroup';
import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidV4 } from 'uuid';
import { getDatabasePath } from '../config';

type EpisodeGroupRow = {
  id: string;
  parent_group_id: string | null;
  content: string;
  display_order: number;
  group_type: EpisodeGroupType;
  updated_at: string;
};

type EpisodeGroupContent = {
  name?: string;
  // 将来的な拡張用に他のプロパティも受け取れるようにしておく
  [key: string]: unknown;
};

function parseEpisodeGroupContent(content: string): EpisodeGroupContent {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return parsed as EpisodeGroupContent;
    }
  } catch {
    // JSONの破損などは呼び出し元でデフォルト値にフォールバックさせる
  }
  return {};
}

// DBのsnake_caseカラム名をcamelCaseに変換し、EpisodeGroup型にマッピング
function mapRowToEpisodeGroup(row: EpisodeGroupRow): EpisodeGroup {
  const content = parseEpisodeGroupContent(row.content);
  return {
    id: row.id,
    name: typeof content.name === 'string' ? content.name : '',
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
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeGroupRow[]>(
      'SELECT * FROM episode_groups ORDER BY display_order ASC'
    );
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
    parentId: string | null;
    groupType: EpisodeGroupType;
    displayOrder: number;
  }): Promise<EpisodeGroup> {
    const id = uuidV4();
    const now = new Date().toISOString();
    const db = new Database(await getDatabasePath());
    await db.execute(
      `INSERT INTO episode_groups (id, parent_group_id, content, display_order, group_type, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [id, params.parentId, JSON.stringify({ name: params.name }), params.displayOrder, params.groupType, now]
    );
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
  async updateGroupName(groupId: string, newName: string): Promise<void> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<{ content: string }[]>(
      'SELECT content FROM episode_groups WHERE id = ?',
      [groupId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(`Episode group not found: ${groupId}`);
    }
    const currentContent = parseEpisodeGroupContent(rows[0]?.content ?? '{}');
    const newContent = JSON.stringify({ ...currentContent, name: newName });
    const now = new Date().toISOString();
    await db.execute('UPDATE episode_groups SET content = ?, updated_at = ? WHERE id = ?', [
      newContent,
      now,
      groupId,
    ]);
  },

  /**
   * グループの親を更新する
   * @param groupId 対象グループID
   * @param newParentId 新しい親グループID (nullの場合はルート)
   */
  async updateGroupParent(groupId: string, newParentId: string | null): Promise<void> {
    const db = new Database(await getDatabasePath());
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE episode_groups SET parent_group_id = ?, updated_at = ? WHERE id = ?',
      [newParentId, now, groupId]
    );
  },

  /**
   * 指定したIDのグループを取得する
   * @param groupId グループID
   * @returns EpisodeGroupオブジェクト、存在しない場合はnull
   */
  async getGroupById(groupId: string): Promise<EpisodeGroup | null> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeGroupRow[]>(
      'SELECT * FROM episode_groups WHERE id = ?',
      [groupId]
    );
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return mapRowToEpisodeGroup(rows[0]);
  },

  /**
   * 指定したparentIdの子グループを取得する
   * @param parentId 親グループID（nullの場合はルート）
   * @returns 子グループの配列
   */
  async getGroups(parentId: string | null): Promise<readonly EpisodeGroup[]> {
    const db = new Database(await getDatabasePath());
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
    return (rows as EpisodeGroupRow[]).map(mapRowToEpisodeGroup);
  },

  /**
   * 種別が 'album' のグループをすべて取得する
   * @returns フラットなEpisodeGroupの配列
   */
  async findAlbumGroups(): Promise<readonly EpisodeGroup[]> {
    const db = new Database(await getDatabasePath());
    const rows = await db.select<EpisodeGroupRow[]>(
      "SELECT * FROM episode_groups WHERE group_type = 'album'"
    );
    return rows.map(mapRowToEpisodeGroup);
  },

  /**
   * 複数のグループの表示順序を一括で更新する
   * @param groups グループIDと新しい表示順序のペアの配列
   */
  async updateOrders(groups: readonly { id: string; display_order: number }[]): Promise<void> {
    const db = new Database(await getDatabasePath());
    await db.execute('BEGIN TRANSACTION');
    try {
      const now = new Date().toISOString();
      for (const group of groups) {
        await db.execute(
          'UPDATE episode_groups SET display_order = ?, updated_at = ? WHERE id = ?',
          [group.display_order, now, group.id]
        );
      }
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  },

  /**
   * 複数のグループIDを指定して、関連するグループを一括で削除する
   * @param groupIds 削除するグループIDの配列
   */
  async deleteGroups(groupIds: readonly string[]): Promise<void> {
    if (groupIds.length === 0) {
      return;
    }
    const db = new Database(await getDatabasePath());
    const placeholders = groupIds.map(() => '?').join(',');
    await db.execute(`DELETE FROM episode_groups WHERE id IN (${placeholders})`, [...groupIds]);
  },
};
