import type { Episode } from '$lib/domain/entities/episode';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { generateEpisodeFilenames } from '$lib/domain/services/generateEpisodeFilenames';
import { parseScriptToSubtitleLines } from '$lib/domain/services/parseScriptToSubtitleLines';
import { extractYoutubeVideoId } from '$lib/domain/services/youtubeUrlValidator';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { subtitleLineRepository } from '$lib/infrastructure/repositories/subtitleLineRepository';
import { youtubeRepository } from '$lib/infrastructure/repositories/youtubeRepository';
import { assert, assertNotNull, assertNotUndefined } from '$lib/utils/assertion';
import { bcp47ToLanguageName } from '$lib/utils/language';
import { v4 as uuidV4 } from 'uuid';

export type YoutubeEpisodeAddPayload = {
  readonly source: 'youtube';
  readonly metadata: YoutubeMetadata;
  readonly url: string;
};

export type FileBasedEpisodeAddPayload = {
  readonly source: 'file';
  readonly title: string;
  readonly audioFilePath: string;
  readonly scriptFilePath: string;
  readonly learningLanguage: string;
  readonly tsvConfig?: TsvConfig;
};

export type EpisodeAddPayload = FileBasedEpisodeAddPayload | YoutubeEpisodeAddPayload;

/**
 * ファイルから新しいエピソードを追加するためのパラメータ
 */
interface AddNewEpisodeFromFilesParams {
  episodeGroupId: string;
  displayOrder: number;
  title: string;
  mediaFilePath: string;
  scriptFilePath: string;
  learningLanguage: string;
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
    console.info(
      `Generated filenames: audio=${audioFilename}, script=${scriptFilename}, uuid=${uuid}`
    );
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
  console.info(`Adding new episode with params: ${JSON.stringify(params)}`);
  const {
    episodeGroupId,
    displayOrder,
    title,
    mediaFilePath: audioFilePath,
    scriptFilePath,
    learningLanguage,
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
      id: uuid,
      episodeGroupId,
      displayOrder,
      title,
      mediaPath,
      learningLanguage,
      explanationLanguage: 'Japanese',
    });
    try {
      const scriptExtension = scriptFilename.split('.').pop()?.toLowerCase();
      if (scriptExtension === undefined) {
        throw new Error('Script file extension is undefined');
      }

      const result = parseScriptToSubtitleLines(
        scriptContent,
        scriptExtension,
        episode.id,
        tsvConfig
      );

      const subtitleLines = result.subtitleLines;
      const warnings = result.warnings;

      for (const warning of warnings) {
        console.warn(`Script parsing warning for episode ${episode.id}: ${warning}`);
      }

      // NOTE: 本当はトランザクションでepisodeと一緒に入れるべきだけど・・・。実装の楽さを優先した。
      await subtitleLineRepository.bulkInsertSubtitleLines(episode.id, subtitleLines);
    } catch (err) {
      await episodeRepository.deleteEpisode(episode.id);
      throw err;
    }
  } catch (err) {
    console.error(`Failed to add new episode: ${err instanceof Error ? err.stack : err}`);
    await fileRepository.deleteEpisodeData(uuid);
    throw new Error('Failed to add new episode.');
  }
}

interface AddNewYoutubeEpisodeParams {
  episodeGroupId: string;
  displayOrder: number;
  youtubeMetadata: YoutubeMetadata;
}

async function addYoutubeEpisode(params: AddNewYoutubeEpisodeParams): Promise<void> {
  console.info(`Adding new YouTube episode with params: ${JSON.stringify(params)}`);
  const { episodeGroupId, displayOrder, youtubeMetadata } = params;
  const { title, embedUrl, language, trackKind } = youtubeMetadata;

  const videoId = extractYoutubeVideoId(embedUrl);
  assertNotNull(videoId, `Cannot extract video ID: ${embedUrl}`);
  const languageName = bcp47ToLanguageName(language);
  assertNotUndefined(languageName, `Unsupported language: ${language}`);

  const subtitle = await youtubeRepository.fetchSubtitle({
    videoId,
    trackKind,
    language,
  });
  const episode = await episodeRepository.addEpisode({
    id: uuidV4(),
    episodeGroupId,
    displayOrder,
    title,
    mediaPath: embedUrl,
    learningLanguage: languageName,
    explanationLanguage: 'Japanese',
  });

  try {
    const subtitleLines = subtitle.map((subtitleLine) => ({
      ...subtitleLine,
      episodeId: episode.id,
    }));
    await subtitleLineRepository.bulkInsertSubtitleLines(episode.id, subtitleLines);
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
  payload: EpisodeAddPayload,
  episodeGroupId: string,
  existingEpisodes: readonly Episode[]
): Promise<void> {
  console.info(`Adding episode for group ${episodeGroupId}`);

  const displayOrder = calculateMaxDisplayOrder(existingEpisodes) + 1;

  assert(
    payload.source === 'file' || payload.source === 'youtube',
    `Unknown payload source: ${JSON.stringify(payload)}`
  );

  if (payload.source === 'file') {
    await addNewEpisodeFromFiles({
      episodeGroupId,
      displayOrder,
      title: payload.title,
      mediaFilePath: payload.audioFilePath,
      scriptFilePath: payload.scriptFilePath,
      learningLanguage: payload.learningLanguage,
      tsvConfig: payload.tsvConfig,
    });
    console.info(`Successfully added file episode for group ${episodeGroupId}`);
    return;
  }

  if (payload.source === 'youtube') {
    await addYoutubeEpisode({
      episodeGroupId,
      displayOrder,
      youtubeMetadata: payload.metadata,
    });
    console.info(`Successfully added YouTube episode for group ${episodeGroupId}`);
    return;
  }
}
