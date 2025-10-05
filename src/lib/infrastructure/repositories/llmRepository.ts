import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';
import { invoke } from '@tauri-apps/api/core';
import { debug, info } from '@tauri-apps/plugin-log';

export const llmRepository = {
  async analyzeSentence(
    apiKey: string,
    learningLanguage: string,
    explanationLanguage: string,
    context: string,
    targetSentence: string
  ): Promise<SentenceAnalysisResult> {
    info(
      `Analyzing sentence: ${targetSentence}, ${learningLanguage} => ${explanationLanguage}, context: ${context}`
    );

    const response = await invoke<SentenceAnalysisResult>('analyze_sentence_with_llm', {
      apiKey,
      learningLanguage,
      explanationLanguage,
      context,
      targetSentence,
    });
    debug(`LLM analysis result: ${JSON.stringify(response)}`);

    return response;
  },
};
