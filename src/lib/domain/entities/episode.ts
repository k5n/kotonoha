/**
 * 音声ファイルとスクリプトのペアを表すエンティティ。
 */
export type Episode = {
  readonly id: string;
  readonly episodeGroupId: string;
  readonly displayOrder: number;
  readonly title: string;
  readonly mediaPath: string;

  readonly learningLanguage: string;
  readonly explanationLanguage: string;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly sentenceCardCount: number;
};
