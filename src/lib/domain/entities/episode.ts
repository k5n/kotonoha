/**
 * 音声ファイルとスクリプトのペアを表すエンティティ。
 */
export type Episode = {
  readonly id: number;
  readonly episodeGroupId: string;
  readonly displayOrder: number;
  readonly title: string;
  readonly mediaPath: string;

  readonly learningLanguage: string;
  readonly explanationLanguage: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly sentenceCardCount: number;
};
