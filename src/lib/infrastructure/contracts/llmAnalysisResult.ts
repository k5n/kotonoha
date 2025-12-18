import type {
  SentenceAnalysisItem,
  SentenceAnalysisResult,
} from '$lib/domain/entities/sentenceAnalysisResult';

export type LlmAnalysisItem = Omit<SentenceAnalysisItem, 'id'>;
export type LlmAnalysisResult = Omit<SentenceAnalysisResult, 'items'> & {
  items: LlmAnalysisItem[];
};
