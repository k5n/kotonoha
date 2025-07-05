import type { SentenceMiningResult } from '$lib/domain/entities/sentenceMiningResult';
import type { AnalyzeSentenceWithLlmResponse } from '$lib/infrastructure/contracts/llm';
import { invoke } from '@tauri-apps/api/core';

export class LlmRepository {
  async analyzeSentence(
    apiKey: string,
    learningLanguage: string,
    explanationLanguage: string,
    context: string,
    targetSentence: string
  ): Promise<SentenceMiningResult> {
    const response = await invoke<AnalyzeSentenceWithLlmResponse>('analyze_sentence_with_llm', {
      apiKey,
      learningLanguage,
      explanationLanguage,
      context,
      targetSentence,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.result;
  }
}
