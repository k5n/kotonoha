/**
 * エピソードを分類するためのグループエンティティ。
 * グループは入れ子構造を持つことができます。
 * groupType: "album"（エピソード格納可）または "folder"（サブグループのみ格納可）
 */
export type EpisodeGroup = {
  readonly id: number;
  readonly name: string;
  readonly displayOrder: number;
  readonly parentId: number | null;
  readonly groupType: 'album' | 'folder';
  // フロントエンドでツリー構造を扱いやすくするためのプロパティ
  readonly children: readonly EpisodeGroup[];
};
