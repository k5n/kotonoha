/**
 * これまでにSentence Miningされた単語やイディオムのマスターデータ。
 */
export type Vocabulary = {
  readonly id: number;
  readonly expression: string; // e.g., "take off"
};
