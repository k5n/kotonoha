import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';
import type { SubtitleLine } from '$lib/domain/entities/subtitleLine';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { llmRepository } from '$lib/infrastructure/repositories/llmRepository';
import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';
import { subtitleLineRepository } from '$lib/infrastructure/repositories/subtitleLineRepository';

async function ensureApiKey(): Promise<string> {
  const apiKey = apiKeyStore.gemini.value;
  if (apiKey !== null) {
    return apiKey;
  }
  const storedApiKey = await apiKeyRepository.getGeminiApiKey();
  if (storedApiKey !== null) {
    apiKeyStore.gemini.set(storedApiKey);
    return storedApiKey;
  }
  throw new Error('API key is not set');
}

/**
 * 指定したダイアログを LLM で解析し、マイニング用の情報を返すユースケース
 * @param subtitleLine 解析対象のダイアログ
 * @param context 解析に使用するコンテキストとなるダイアログの配列
 * @returns 解析結果（例: マイニング候補文やメタ情報など）
 */
export async function analyzeSubtitleLineForMining(
  subtitleLine: SubtitleLine,
  context: readonly SubtitleLine[]
): Promise<SentenceAnalysisResult> {
  // 1. キャッシュを確認
  const cachedCards = await sentenceCardRepository.getSentenceCardsBySubtitleLineId(
    subtitleLine.id
  );
  if (cachedCards.length > 0) {
    // ダイアログの翻訳と説明をキャッシュから取得
    const cachedSubtitleLine = await subtitleLineRepository.getSubtitleLineById(subtitleLine.id);
    return {
      sentence: cachedSubtitleLine?.sentence || '',
      translation: cachedSubtitleLine?.translation || '',
      explanation: cachedSubtitleLine?.explanation || '',
      items: cachedCards.map((card) => ({
        id: card.id,
        expression: card.expression,
        partOfSpeech: card.partOfSpeech,
        contextualDefinition: card.contextualDefinition,
        coreMeaning: card.coreMeaning,
        exampleSentence: card.sentence,
        status: card.status,
      })),
    };
  }

  // 2. キャッシュがなければLLMで解析
  const targetSentence = subtitleLine.correctedText || subtitleLine.originalText;
  if (!targetSentence) {
    throw new Error('SubtitleLine text is empty');
  }
  const apiKey = await ensureApiKey();
  const contextSentences = context.map((d) => d.correctedText || d.originalText).join('\n');
  const result = await llmRepository.analyzeSentence(
    apiKey,
    'English',
    'Japanese',
    contextSentences,
    targetSentence
  );

  // 3. 解析結果をキャッシュとしてDBに保存
  await subtitleLineRepository.updateSubtitleLineAnalysis(
    subtitleLine.id,
    result.translation,
    result.explanation,
    result.sentence
  );
  await sentenceCardRepository.cacheAnalysisItems(subtitleLine.id, result.items);

  // 4. 保存したキャッシュを読み込み、IDを付与して返す
  const newCachedCards = await sentenceCardRepository.getSentenceCardsBySubtitleLineId(
    subtitleLine.id
  );

  return {
    sentence: result.sentence,
    translation: result.translation,
    explanation: result.explanation,
    items: newCachedCards.map((card) => ({
      id: card.id,
      expression: card.expression,
      partOfSpeech: card.partOfSpeech,
      contextualDefinition: card.contextualDefinition,
      coreMeaning: card.coreMeaning,
      exampleSentence: card.sentence,
      status: card.status,
    })),
  };
}
