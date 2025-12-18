import type {
  SentenceAnalysisItem,
  SentenceAnalysisResult,
} from '$lib/domain/entities/sentenceAnalysisResult';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidV4 } from 'uuid';
import type { LlmAnalysisResult } from '../contracts/llmAnalysisResult';

export const llmRepository = {
  async analyzeSentence(
    apiKey: string,
    learningLanguage: string,
    explanationLanguage: string,
    context: string,
    targetSentence: string
  ): Promise<SentenceAnalysisResult> {
    console.info(
      `Analyzing sentence: ${targetSentence}, ${learningLanguage} => ${explanationLanguage}, context: ${context}`
    );

    const response = await invoke<LlmAnalysisResult>('analyze_sentence_with_llm', {
      apiKey,
      learningLanguage,
      explanationLanguage,
      context,
      targetSentence,
    });
    console.debug(`LLM analysis result: ${JSON.stringify(response)}`);

    // Generate IDs for items
    const itemsWithIds: SentenceAnalysisItem[] = response.items.map((item) => ({
      ...item,
      id: uuidV4(),
    }));

    return {
      ...response,
      items: itemsWithIds,
    };
  },
};
