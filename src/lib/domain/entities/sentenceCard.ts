/**
 * Sentence Miningによって作成された学習カードのエンティティ。
 */
export type SentenceCardStatus = 'active' | 'suspended';

import type { Vocabulary } from './vocabulary';

export type SentenceCard = {
  readonly id: number;
  readonly dialogueId: number;
  readonly targetExpression: string;
  readonly sentence: string; // 抽出対象を含むセンテンス全体
  readonly definition: string; // LLMによって生成された意味・説明
  readonly status: SentenceCardStatus;
  readonly createdAt: Date;
  // 関連する単語/イディオム
  readonly vocabulary: Vocabulary;
};
