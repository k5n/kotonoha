/**
 * 音声ファイルとスクリプトのペアを表すエンティティ。
 */
export type Episode = {
  readonly id: number;
  readonly episodeGroupId: number;
  readonly displayOrder: number;
  readonly title: string;
  readonly audioPath: string;
  /**
   * durationSeconds は常に 0 です。将来的に削除予定。
   */
  readonly durationSeconds: number;
  readonly learningLanguage: string;
  readonly explanationLanguage: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly sentenceCardCount: number;
};
