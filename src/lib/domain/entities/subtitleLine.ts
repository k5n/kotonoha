export type AtomicSubtitleLine = {
  readonly startTimeMs: number;
  readonly endTimeMs: number | null;
  readonly originalText: string;
};

/*
 * 新規作成時に必要なプロパティをまとめた型。
 */
export type NewSubtitleLine = {
  readonly episodeId: string;
} & AtomicSubtitleLine;

/**
 * スクリプト内の個々のセリフを表すエンティティ。
 */
export type SubtitleLine = NewSubtitleLine & {
  readonly id: string;
  readonly sequenceNumber?: number;
  readonly correctedText: string | null;
  readonly translation: string | null;
  readonly explanation: string | null;
  readonly sentence: string | null;
  readonly deletedAt: string | null;
};

export type SubtitleLineParseResult = {
  readonly subtitleLines: readonly NewSubtitleLine[];
  readonly warnings: readonly string[];
};
