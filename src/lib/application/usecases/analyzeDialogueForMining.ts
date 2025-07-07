import type { Dialogue } from '$lib/domain/entities/dialogue';
import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { llmRepository } from '$lib/infrastructure/repositories/llmRepository';

// とりあえず英語のみサポートするので定数
const PART_OF_SPEECH_OPTIONS: readonly string[] = [
  'Noun',
  'Pronoun',
  'Verb',
  'Adjective',
  'Adverb',
  'Preposition',
  'Conjunction',
  'Interjection',
  'Determiner',
  'Phrasal Verb',
  'Idiom',
  'Collocation',
  'Expression',
];

/**
 * 指定したダイアログを LLM で解析し、マイニング用の情報を返すユースケース
 * @param dialogue 解析対象のダイアログ
 * @param context 解析に使用するコンテキストとなるダイアログの配列
 * @returns 解析結果（例: マイニング候補文やメタ情報など）
 */
export async function analyzeDialogueForMining(
  dialogue: Dialogue,
  context: readonly Dialogue[]
): Promise<SentenceAnalysisResult> {
  if (!dialogue.correctedText) {
    throw new Error('Dialogue text is empty');
  }
  const apiKey = await apiKeyRepository.getApiKey();
  if (!apiKey) {
    throw new Error('API key is not set');
  }
  const contextSentences = context.map((d) => d.correctedText).join('\n');
  const result = await llmRepository.analyzeSentence(
    apiKey,
    'English',
    'Japanese',
    PART_OF_SPEECH_OPTIONS,
    contextSentences,
    dialogue.correctedText
  );
  return result;
}
