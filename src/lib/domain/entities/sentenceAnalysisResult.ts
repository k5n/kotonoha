export type SentenceAnalysisItem = {
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
