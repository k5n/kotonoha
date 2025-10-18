import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
import type { Episode } from '$lib/domain/entities/episode';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { generateEpisodeFilenames } from '$lib/domain/services/generateEpisodeFilenames';
import { parseScriptToDialogues } from '$lib/domain/services/parseScriptToDialogues';
import { extractYoutubeVideoId } from '$lib/domain/services/youtubeUrlValidator';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { youtubeRepository } from '$lib/infrastructure/repositories/youtubeRepository';
import { bcp47ToLanguageName } from '$lib/utils/language';
import { error, info, warn } from '@tauri-apps/plugin-log';

/**
 * ファイルから新しいエピソードを追加するためのパラメータ
 */
interface AddNewEpisodeFromFilesParams {
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
 * ファイルから新しいエピソードを追加するユースケース
 *
 * @param params - 新しいエピソードの情報
 * @throws エピソードの追加に失敗した場合にエラーをスローする
 */
async function addNewEpisodeFromFiles(params: AddNewEpisodeFromFilesParams): Promise<void> {
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
    const mediaPath = await fileRepository.saveAudioFile(audioFilePath, uuid, audioFilename);
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

async function addYoutubeEpisode(params: AddNewYoutubeEpisodeParams): Promise<void> {
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

/**
 * エピソードの表示順序の最大値を計算する
 */
function calculateMaxDisplayOrder(episodes: readonly Episode[]): number {
  return episodes.reduce((max, ep) => Math.max(max, ep.displayOrder || 0), 0);
}

/**
 * ストアからエピソードを追加する統合関数
 *
 * ストアの状態管理、ペイロード構築、エピソード追加処理を統合的に実行する。
 * Presentation層は成功時のinvalidateAll()と失敗時のエラーメッセージ設定のみを行う。
 *
 * @param episodeGroupId - エピソードを追加するグループのID
 * @param existingEpisodes - 既存のエピソード一覧（表示順序計算用）
 * @throws エピソードの追加に失敗した場合にエラーをスローする
 */
export async function addNewEpisode(
  episodeGroupId: number,
  existingEpisodes: readonly Episode[]
): Promise<void> {
  info(`Adding episode from store for group ${episodeGroupId}`);

  const payload = episodeAddStore.buildPayload();
  if (!payload) {
    error('No valid payload to submit');
    throw new Error('Invalid form data');
  }

  episodeAddStore.startSubmitting();

  try {
    const displayOrder = calculateMaxDisplayOrder(existingEpisodes) + 1;

    if (payload.source === 'file') {
      await addNewEpisodeFromFiles({
        episodeGroupId,
        displayOrder,
        title: payload.title,
        mediaFilePath: payload.audioFilePath,
        scriptFilePath: payload.scriptFilePath,
        tsvConfig: payload.tsvConfig,
      });
    } else if (payload.source === 'youtube') {
      await addYoutubeEpisode({
        episodeGroupId,
        displayOrder,
        youtubeMetadata: payload.metadata,
      });
    } else {
      throw new Error(`Unknown payload source: ${JSON.stringify(payload)}`);
    }

    episodeAddStore.close();
    info(`Successfully added episode for group ${episodeGroupId}`);
  } catch (err) {
    error(`Failed to add episode from store: ${err}`);
    episodeAddStore.close();
    throw err;
  }
}
