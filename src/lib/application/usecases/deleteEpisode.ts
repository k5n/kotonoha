import type { Episode } from '$lib/domain/entities/episode';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';
import { error } from '@tauri-apps/plugin-log';

/**
 * エピソードを、関連するファイルやデータと共に削除します。
 * @param episodeId 削除するエピソードのID
 */
export async function deleteEpisode(episode: Episode): Promise<void> {
  try {
    // 関連ファイルを削除
    // audioPath から uuid を抽出 (例: media/uuid/audio.mp3 -> uuid)
    const uuid = episode.audioPath.split('/')[1];
    if (uuid) {
      await fileRepository.deleteEpisodeData(uuid);
    } else {
      error(
        `Could not determine UUID for episode (id=${episode.id}: ${episode.title}) from path ${episode.audioPath}`
      );
    }

    // Sentence Cards を削除
    // Dialogues を削除する前に、Sentence Cards を先に削除する必要あり。
    await sentenceCardRepository.deleteByEpisodeId(episode.id);

    // Dialogues を削除
    await dialogueRepository.deleteByEpisodeId(episode.id);

    // エピソードを削除
    await episodeRepository.deleteEpisode(episode.id);
  } catch (e) {
    error(`Failed to delete episode ${episode.id}: ${e}`);
    throw e; // or handle error as needed
  }
}
