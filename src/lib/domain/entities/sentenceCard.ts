/**
 * Sentence Miningによって作成された学習カードのエンティティ。
 */
export type SentenceCardStatus = 'active' | 'suspended';

export type SentenceCard = {
  readonly id: number;
  readonly dialogueId: number;
  readonly expression: string;
  readonly sentence: string; // 抽出対象を含むセンテンス全体
  readonly definition: string; // LLMによって生成された意味・説明
  readonly status: SentenceCardStatus;
  readonly createdAt: Date;
};
