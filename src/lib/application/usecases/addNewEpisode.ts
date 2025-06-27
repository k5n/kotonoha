// import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
// import type { Episode } from '$lib/domain/entities/Episode';
// import { episodeStore } from '$lib/application/stores/episodeStore';
import { info } from '@tauri-apps/plugin-log';

/**
 * 新しいエピソードを追加するためのパラメータ
 */
interface AddNewEpisodeParams {
  episodeGroupId: number;
  displayOrder: number;
  title: string;
  audioPath: string;
  scriptPath: string;
}

/**
 * 新しいエピソードを追加するユースケース
 *
 * @param params - 新しいエピソードの情報
 * @throws エピソードの追加に失敗した場合にエラーをスローする
 */
export const addNewEpisode = async (params: AddNewEpisodeParams): Promise<void> => {
  info(`Adding new episode with params: ${JSON.stringify(params)}`);
  // try {
  //   const newEpisode = await episodeRepository.addEpisode({
  //     title: params.title,
  //     audio_path: params.audioPath,
  //     script_path: params.scriptPath,
  //     episode_group_id: params.episodeGroupId,
  //   });
  //   episodeStore.addEpisode(newEpisode);
  // } catch (error) {
  //   console.error('Failed to add new episode:', error);
  //   throw new Error('エピソードの追加に失敗しました。');
  // }
};
