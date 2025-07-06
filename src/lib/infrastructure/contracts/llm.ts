import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';

export type AnalyzeSentenceWithLlmResponse = {
  result: SentenceAnalysisResult;
  error?: string;
};
