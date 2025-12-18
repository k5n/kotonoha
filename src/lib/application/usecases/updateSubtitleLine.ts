import { subtitleLineRepository } from '$lib/infrastructure/repositories/subtitleLineRepository';

/**
 * Updates the corrected text of a subtitleLine.
 * @param subtitleLineId The ID of the subtitleLine to update.
 * @param correctedText The new corrected text. If the text is the same as the original, or empty, it will be stored as NULL.
 */
export async function updateSubtitleLine(
  subtitleLineId: string,
  correctedText: string
): Promise<void> {
  await subtitleLineRepository.updateSubtitleLineText(subtitleLineId, correctedText);
}
