import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';
import { error } from '@tauri-apps/plugin-log';

/**
 * エピソードを、関連するファイルやデータと共に削除します。
 * @param episode 削除するエピソードの情報
 */
export async function deleteEpisode(episode: {
  readonly id: number;
  readonly title: string;
  readonly mediaPath: string;
}): Promise<void> {
  try {
    // mediaPath から uuid を抽出 (例: media/uuid/full.mp3 -> uuid)
    const uuid = episode.mediaPath.split('/')[1];
    if (uuid) {
      await fileRepository.deleteEpisodeData(uuid);
    } else {
      error(
        `Could not determine UUID for episode (id=${episode.id}: ${episode.title}) from path ${episode.mediaPath}`
      );
    }

    // NOTE: sentence_cards テーブル自体は episode_id を持っていないので、
    // Dialogues を削除する前に、Sentence Cards を先に削除する必要あり。
    await sentenceCardRepository.deleteByEpisodeId(episode.id);
    await dialogueRepository.deleteByEpisodeId(episode.id);
    await episodeRepository.deleteEpisode(episode.id);
  } catch (e) {
    error(`Failed to delete episode ${episode.id}: ${e}`);
    throw e; // or handle error as needed
  }
}
