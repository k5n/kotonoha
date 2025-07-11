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
    const sentence = dialogue.correctedText || dialogue.originalText;
    for (const result of selectedResults) {
      await sentenceCardRepository.addSentenceCard({
        dialogueId: dialogue.id,
        expression: result.expression,
        sentence: sentence,
        definition: result.definition,
        status: 'active',
      });
    }
  } catch (err) {
    error(`Error creating mining cards: ${err}`);
    // ユースケースからエラーをスローして、UI側でキャッチできるようにする
    throw new Error('Failed to create sentence cards.');
  }
}
