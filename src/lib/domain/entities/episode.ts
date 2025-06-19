/**
 * 音声ファイルとスクリプトのペアを表すエンティティ。
 */
export type Episode = {
  readonly id: number;
  readonly episodeGroupId: number;
  readonly displayOrder: number;
  readonly title: string;
  readonly audioPath: string;
  readonly scriptPath: string;
  readonly durationSeconds: number;
  readonly createdAt: string; // ISO 8601 format date string
  readonly updatedAt: string; // ISO 8601 format date string
};
