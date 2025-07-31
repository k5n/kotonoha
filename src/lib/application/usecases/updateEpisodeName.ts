import type { Episode } from '$lib/domain/entities/episode';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';

/**
 * エピソード名を更新する
 * @param episodeId 対象のエピソードID
 * @param newName 新しいエピソード名
 */
export async function updateEpisodeName(episodeId: Episode['id'], newName: string): Promise<void> {
  await episodeRepository.updateEpisode(episodeId, { title: newName });
}
