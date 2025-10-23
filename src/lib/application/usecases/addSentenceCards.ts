import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';

/**
 * 選択されたキャッシュ済みのカードをアクティブにするユースケース
 * @param selectedCardIds アクティブにするカードのID配列
 */
export async function addSentenceCards(selectedCardIds: readonly number[]): Promise<void> {
  console.info(`Activating mining cards: ${selectedCardIds.join(', ')}`);
  try {
    await sentenceCardRepository.activateCachedCards(selectedCardIds);
  } catch (err) {
    console.error(`Error activating mining cards: ${err}`);
    throw new Error('Failed to activate sentence cards.');
  }
}
