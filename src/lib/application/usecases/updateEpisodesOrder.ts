import type { Episode } from '$lib/domain/entities/episode';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';

/**
 * エピソードの表示順序を更新する
 * @param episodes 並び替え後のエピソードのリスト
 */
export async function updateEpisodesOrder(episodes: readonly Episode[]): Promise<void> {
  const episodesWithOrder = episodes.map((episode, index) => ({
    id: episode.id,
    display_order: index,
  }));
  await episodeRepository.updateOrders(episodesWithOrder);
}
