import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';
import { debug, error } from '@tauri-apps/plugin-log';

/**
 * 選択されたキャッシュ済みのカードをアクティブにするユースケース
 * @param selectedCardIds アクティブにするカードのID配列
 */
export async function addSentenceCards(selectedCardIds: readonly number[]): Promise<void> {
  debug(`Activating mining cards: ${selectedCardIds.join(', ')}`);
  try {
    await sentenceCardRepository.activateCachedCards(selectedCardIds);
  } catch (err) {
    error(`Error activating mining cards: ${err}`);
    // ユースケースからエラーをスローして、UI側でキャッチできるようにする
    throw new Error('Failed to activate sentence cards.');
  }
}
