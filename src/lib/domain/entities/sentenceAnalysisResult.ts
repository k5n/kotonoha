export type SentenceAnalysisItem = {
  id: number; // sentence_cards.id
  expression: string;
  partOfSpeech: string;
  contextualDefinition: string;
  coreMeaning: string;
  exampleSentence: string;
};

export type SentenceAnalysisResult = {
  translation: string;
  explanation: string;
  items: SentenceAnalysisItem[];
};
