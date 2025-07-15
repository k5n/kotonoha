/**
 * スクリプト内の個々のセリフを表すエンティティ。
 */
export type Dialogue = {
  readonly id: number;
  readonly episodeId: number;
  readonly startTimeMs: number;
  readonly endTimeMs: number;
  readonly originalText: string;
  readonly correctedText: string | null;
  readonly translation: string | null;
  readonly explanation: string | null;
};
