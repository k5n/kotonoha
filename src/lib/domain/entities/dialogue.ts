/**
 * 新規作成時に必要なプロパティをまとめた型。
 */
export type NewDialogue = {
  readonly episodeId: number;
  readonly startTimeMs: number;
  readonly endTimeMs: number | null;
  readonly originalText: string;
};

/**
 * スクリプト内の個々のセリフを表すエンティティ。
 */
export type Dialogue = NewDialogue & {
  readonly id: number;
  readonly correctedText: string | null;
  readonly translation: string | null;
  readonly explanation: string | null;
  readonly deletedAt: string | null;
};
