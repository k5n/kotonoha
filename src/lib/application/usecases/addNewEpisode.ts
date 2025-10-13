import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { generateEpisodeFilenames } from '$lib/domain/services/generateEpisodeFilenames';
import {
  parseScriptToDialogues,
  type TsvConfig,
} from '$lib/domain/services/parseScriptToDialogues';
import { extractYoutubeVideoId } from '$lib/domain/services/youtubeUrlValidator';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { youtubeRepository } from '$lib/infrastructure/repositories/youtubeRepository';
import { bcp47ToLanguageName } from '$lib/utils/language';
import { error, info, warn } from '@tauri-apps/plugin-log';

/**
 * 新しいエピソードを追加するためのパラメータ
 */
interface AddNewEpisodeParams {
  episodeGroupId: number;
  displayOrder: number;
  title: string;
  mediaFilePath: string;
  scriptFilePath: string;
  tsvConfig?: TsvConfig;
}

/**
 * UUIDの衝突を避けて未使用のUUID・ファイル名を生成する
 */
async function generateUniqueEpisodeFilenames(
  audioFilePath: string,
  scriptFilePath: string,
  maxAttempts = 10
): Promise<{ audioFilename: string; scriptFilename: string; uuid: string }> {
  let attempts = 0;
  let audioFilename: string;
  let scriptFilename: string;
  let uuid: string;
  do {
    const {
      media: audio,
      script,
      uuid: generatedUuid,
    } = generateEpisodeFilenames(audioFilePath, scriptFilePath);
    audioFilename = audio;
    scriptFilename = script;
    uuid = generatedUuid;
    info(`Generated filenames: audio=${audioFilename}, script=${scriptFilename}, uuid=${uuid}`);
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate a unique UUID. Please try again later.');
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
  const {
    episodeGroupId,
    displayOrder,
    title,
    mediaFilePath: audioFilePath,
    scriptFilePath,
    tsvConfig,
  } = params;
  const { audioFilename, scriptFilename, uuid } = await generateUniqueEpisodeFilenames(
    audioFilePath,
    scriptFilePath
  );
  try {
    // mediaFilePath: string, scriptFilePath: string
    const mediaPath = await fileRepository.saveAudioFile(audioFilePath, uuid, audioFilename);
    // scriptFilePathから内容を読み込む
    const scriptContent = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
    const episode = await episodeRepository.addEpisode({
      episodeGroupId,
      displayOrder,
      title,
      mediaPath,
      learningLanguage: 'English',
      explanationLanguage: 'Japanese',
    });
    try {
      // scriptFilePathの拡張子を取得
      const scriptExtension = scriptFilename.split('.').pop()?.toLowerCase();

      if (scriptExtension === undefined) {
        throw new Error('Script file extension is undefined');
      }

      const result = parseScriptToDialogues(scriptContent, scriptExtension, episode.id, tsvConfig);

      const dialogues = result.dialogues;
      const warnings = result.warnings;

      for (const warning of warnings) {
        warn(`Script parsing warning for episode ${episode.id}: ${warning}`);
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
    throw new Error('Failed to add new episode.');
  }
}

interface AddNewYoutubeEpisodeParams {
  episodeGroupId: number;
  displayOrder: number;
  youtubeMetadata: YoutubeMetadata;
}

export async function addYoutubeEpisode(params: AddNewYoutubeEpisodeParams): Promise<void> {
  info(`Adding new YouTube episode with params: ${JSON.stringify(params)}`);
  const { episodeGroupId, displayOrder, youtubeMetadata } = params;
  const { title, embedUrl, language, trackKind } = youtubeMetadata;

  const videoId = extractYoutubeVideoId(embedUrl);
  if (videoId === null) {
    throw new Error(`Cannot extract video ID: ${embedUrl}`);
  }
  const languageName = bcp47ToLanguageName(language);
  if (languageName === undefined) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const subtitle = await youtubeRepository.fetchSubtitle({
    videoId,
    trackKind,
    language,
  });
  const episode = await episodeRepository.addEpisode({
    episodeGroupId,
    displayOrder,
    title,
    mediaPath: embedUrl,
    learningLanguage: languageName,
    explanationLanguage: 'Japanese',
  });
  try {
    const dialogues = subtitle.map((dialogue) => ({
      ...dialogue,
      episodeId: episode.id,
    }));
    await dialogueRepository.bulkInsertDialogues(episode.id, dialogues);
  } catch (err) {
    episodeRepository.deleteEpisode(episode.id);
    throw err;
  }
}
