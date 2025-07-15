/**
 * Sentence Miningによって作成された学習カードのエンティティ。
 */
export type SentenceCardStatus = 'active' | 'suspended' | 'cache';

export type SentenceCard = {
  readonly id: number;
  readonly dialogueId: number;
  readonly partOfSpeech: string;
  readonly expression: string;
  readonly sentence: string; // 抽出対象を含むセンテンス全体
  readonly contextualDefinition: string; // LLMによって生成された文脈上の意味
  readonly coreMeaning: string; // LLMによって生成された核となる意味
  readonly status: SentenceCardStatus;
  readonly createdAt: Date;
};
