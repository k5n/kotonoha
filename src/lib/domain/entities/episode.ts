/**
 * 音声ファイルとスクリプトのペアを表すエンティティ。
 */
export type Episode = {
  readonly id: number;
  readonly episodeGroupId: number;
  readonly displayOrder: number;
  readonly title: string;
  readonly audioPath: string;
  readonly durationSeconds: number | null; // 音声の長さ（秒単位）。nullの場合は不明
  readonly learningLanguage: string;
  readonly explanationLanguage: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly sentenceCardCount: number;
};
