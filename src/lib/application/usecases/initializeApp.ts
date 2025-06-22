import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { buildEpisodeGroupTree } from '$lib/domain/services/buildEpisodeGroupTree';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

// 初期画面表示時に必要なデータをまとめて取得するユースケース
export async function initializeApp(): Promise<EpisodeGroup[]> {
  const flatGroups = await episodeGroupRepository.getAllGroups();
  return buildEpisodeGroupTree(flatGroups);
}
