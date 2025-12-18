import type { SentenceCardStatus } from '$lib/domain/entities/sentenceCard';

export type SentenceAnalysisItem = {
  id: string;
  expression: string;
  partOfSpeech: string;
  contextualDefinition: string;
  coreMeaning: string;
  exampleSentence: string;
  status: SentenceCardStatus;
};

export type SentenceAnalysisResult = {
  sentence: string;
  translation: string;
  explanation: string;
  items: SentenceAnalysisItem[];
};
