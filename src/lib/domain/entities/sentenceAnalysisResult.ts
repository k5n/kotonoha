export type SentenceAnalysisItem = {
  expression: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
};

export type SentenceAnalysisResult = {
  items: SentenceAnalysisItem[];
};
