export type EpisodeGroupType = 'album' | 'folder';

/**
 * エピソードを分類するためのグループエンティティ。
 * グループは入れ子構造を持つことができます。
 * groupType: "album"（エピソード格納可）または "folder"（サブグループのみ格納可）
 */
export type EpisodeGroup = {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
  readonly parentId: string | null;
  readonly groupType: EpisodeGroupType;
  // フロントエンドでツリー構造を扱いやすくするためのプロパティ
  readonly children: readonly EpisodeGroup[];
};
