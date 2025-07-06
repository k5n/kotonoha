import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';
import type { AnalyzeSentenceWithLlmResponse } from '$lib/infrastructure/contracts/llm';
import { invoke } from '@tauri-apps/api/core';

export const llmRepository = {
  async analyzeSentence(
    apiKey: string,
    learningLanguage: string,
    explanationLanguage: string,
    partOfSpeechOptions: readonly string[],
    context: string,
    targetSentence: string
  ): Promise<SentenceAnalysisResult> {
    const response = await invoke<AnalyzeSentenceWithLlmResponse>('analyze_sentence_with_llm', {
      apiKey,
      learningLanguage,
      explanationLanguage,
      partOfSpeechOptions,
      context,
      targetSentence,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.result;
  },
};
