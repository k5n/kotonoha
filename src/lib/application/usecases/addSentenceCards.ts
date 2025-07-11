import type { Dialogue } from '$lib/domain/entities/dialogue';
import type { SentenceAnalysisItem } from '$lib/domain/entities/sentenceAnalysisResult';
import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';
import { debug, error } from '@tauri-apps/plugin-log';

export async function addSentenceCards(
  dialogue: Dialogue,
  selectedResults: readonly SentenceAnalysisItem[]
): Promise<void> {
  debug(`Creating mining cards for dialogue: ${dialogue.id}`);
  try {
    for (const result of selectedResults) {
      await sentenceCardRepository.addSentenceCard({
        dialogueId: dialogue.id,
        expression: result.expression,
        sentence: result.exampleSentence,
        contextualDefinition: result.contextualDefinition,
        coreMeaning: result.coreMeaning,
        status: 'active',
      });
    }
  } catch (err) {
    error(`Error creating mining cards: ${err}`);
    // ユースケースからエラーをスローして、UI側でキャッチできるようにする
    throw new Error('Failed to create sentence cards.');
  }
}
