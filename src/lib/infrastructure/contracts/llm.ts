import type { SentenceMiningResult } from '$lib/domain/entities/sentenceMiningResult';

export type AnalyzeSentenceWithLlmResponse = {
  result: SentenceMiningResult;
  error?: string;
};
