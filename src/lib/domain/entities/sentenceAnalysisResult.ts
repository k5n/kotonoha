import type { SentenceCardStatus } from '$lib/domain/entities/sentenceCard';

export type SentenceAnalysisItem = {
  id: number; // sentence_cards.id
  expression: string;
  partOfSpeech: string;
  contextualDefinition: string;
  coreMeaning: string;
  exampleSentence: string;
  status: SentenceCardStatus;
};

export type SentenceAnalysisResult = {
  translation: string;
  explanation: string;
  items: SentenceAnalysisItem[];
};
