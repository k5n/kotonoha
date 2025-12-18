import { fetchEpisodeGroups } from '$lib/application/usecases/fetchEpisodeGroups';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const groupId = params.groupId; // group path （ex: "<uuid>/<uuid>"）
  const groupIdParam = groupId ? groupId.split('/') : [];
  const parentId =
    Array.isArray(groupIdParam) && groupIdParam.length > 0
      ? groupIdParam[groupIdParam.length - 1]
      : null;
  try {
    const groups = await fetchEpisodeGroups(parentId);
    return { groups, errorKey: null };
  } catch (e) {
    console.error(`Failed to fetch episode groups: ${e}`);
    return { groups: [], errorKey: 'groupPage.errors.fetchGroups' };
  }
};
