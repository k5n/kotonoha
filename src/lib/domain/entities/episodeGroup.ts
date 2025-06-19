/**
 * エピソードを分類するためのグループエンティティ。
 * グループは入れ子構造を持つことができます。
 */
export type EpisodeGroup = {
  readonly id: number;
  readonly name: string;
  readonly displayOrder: number;
  readonly parentId: number | null;
  // フロントエンドでツリー構造を扱いやすくするためのプロパティ
  readonly children: readonly EpisodeGroup[];
};
