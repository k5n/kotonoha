import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * グループの表示順序を更新する
 * @param groups 並び替え後のグループのリスト
 */
export async function updateEpisodeGroupsOrder(groups: readonly EpisodeGroup[]): Promise<void> {
  const groupsWithOrder = groups.map((group, index) => ({
    id: group.id,
    display_order: index,
  }));
  await episodeGroupRepository.updateOrders(groupsWithOrder);
}
