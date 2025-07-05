export type SentenceMiningItem = {
  expression: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
};

export type SentenceMiningResult = {
  items: SentenceMiningItem[];
};
