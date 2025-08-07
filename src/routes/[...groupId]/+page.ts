import { fetchEpisodeGroups } from '$lib/application/usecases/fetchEpisodeGroups';
import { error } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const groupId = params.groupId; // パス文字列（例: "2/3"）
  const groupIdParam = groupId ? groupId.split('/') : [];
  const parentId =
    Array.isArray(groupIdParam) && groupIdParam.length > 0
      ? Number(groupIdParam[groupIdParam.length - 1])
      : null;
  try {
    const groups = await fetchEpisodeGroups(parentId);
    return { groups, errorKey: null };
  } catch (e) {
    error(`Failed to fetch episode groups: ${e}`);
    return { groups: [], errorKey: 'groupPage.errors.fetchGroups' };
  }
};
