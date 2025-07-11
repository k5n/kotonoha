import { generateEpisodeFilenames } from '$lib/domain/services/generateEpisodeFilenames';
import { parseSrtToDialogues } from '$lib/domain/services/parseSrtToDialogues';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { error, info, warn } from '@tauri-apps/plugin-log';

/**
 * 新しいエピソードを追加するためのパラメータ
 */
interface AddNewEpisodeParams {
  episodeGroupId: number;
  displayOrder: number;
  title: string;
  audioFile: File;
  scriptFile: File;
}

/**
 * UUIDの衝突を避けて未使用のUUID・ファイル名を生成する
 */
async function generateUniqueEpisodeFilenames(
  audioFile: File,
  scriptFile: File,
  maxAttempts = 10
): Promise<{ audioFilename: string; scriptFilename: string; uuid: string }> {
  let attempts = 0;
  let audioFilename: string;
  let scriptFilename: string;
  let uuid: string;
  do {
    const {
      audio,
      script,
      uuid: generatedUuid,
    } = generateEpisodeFilenames(audioFile.name, scriptFile.name);
    audioFilename = audio;
    scriptFilename = script;
    uuid = generatedUuid;
    info(`Generated filenames: audio=${audioFilename}, script=${scriptFilename}, uuid=${uuid}`);
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('UUIDの生成に失敗しました。しばらくしてから再度お試しください。');
    }
  } while (await fileRepository.uuidFileExists(uuid));
  return { audioFilename, scriptFilename, uuid };
}

/**
 * 新しいエピソードを追加するユースケース
 *
 * @param params - 新しいエピソードの情報
 * @throws エピソードの追加に失敗した場合にエラーをスローする
 */
export async function addNewEpisode(params: AddNewEpisodeParams): Promise<void> {
  info(`Adding new episode with params: ${JSON.stringify(params)}`);
  const { episodeGroupId, displayOrder, title, audioFile, scriptFile } = params;
  const { audioFilename, scriptFilename, uuid } = await generateUniqueEpisodeFilenames(
    audioFile,
    scriptFile
  );
  try {
    const audioPath = await fileRepository.saveAudioFile(audioFile, uuid, audioFilename);
    const scriptPath = await fileRepository.saveScriptFile(scriptFile, uuid, scriptFilename);
    const episode = await episodeRepository.addEpisode({
      episodeGroupId,
      displayOrder,
      title,
      audioPath,
      scriptPath,
      durationSeconds: null,
    });
    try {
      const script = await scriptFile.text();
      const { dialogues, warnings } = parseSrtToDialogues(script, episode.id);
      for (const warning of warnings) {
        warn(`SRT parsing warning for episode ${episode.id}: ${warning}`);
      }
      // NOTE: 本当はトランザクションでepisodeと一緒に入れるべきだけど・・・。実装の楽さを優先した。
      await dialogueRepository.bulkInsertDialogues(episode.id, dialogues);
    } catch (err) {
      await episodeRepository.deleteEpisode(episode.id);
      throw err;
    }
  } catch (err) {
    error(`Failed to add new episode: ${err instanceof Error ? err.stack : err}`);
    await fileRepository.deleteEpisodeData(uuid);
    throw new Error('エピソードの追加に失敗しました。');
  }
}
