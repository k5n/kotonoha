import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';

/**
 * Updates the corrected text of a dialogue.
 * @param subtitleLineId The ID of the dialogue to update.
 * @param correctedText The new corrected text. If the text is the same as the original, or empty, it will be stored as NULL.
 */
export async function updateSubtitleLine(
  subtitleLineId: number,
  correctedText: string
): Promise<void> {
  await dialogueRepository.updateDialogueText(subtitleLineId, correctedText);
}
