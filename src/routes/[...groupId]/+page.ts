import { fetchEpisodeGroups } from '$lib/application/usecases/fetchEpisodeGroups';
import { debug } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  debug(`Loading groups for params: ${JSON.stringify(params)}`);
  const groupId = params.groupId; // パス文字列（例: "2/3"）
  const groupIdParam = groupId ? groupId.split('/') : [];
  const parentId =
    Array.isArray(groupIdParam) && groupIdParam.length > 0
      ? Number(groupIdParam[groupIdParam.length - 1])
      : null;
  debug(`Parent ID for fetching groups: ${parentId}`);
  const groups = await fetchEpisodeGroups(parentId);
  debug(`Fetched groups: ${JSON.stringify(groups)}`);
  return { groups };
};
