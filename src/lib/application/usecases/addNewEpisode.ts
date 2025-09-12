import type { NewDialogue } from '$lib/domain/entities/dialogue';
import { generateEpisodeFilenames } from '$lib/domain/services/generateEpisodeFilenames';
import { parseSrtToDialogues } from '$lib/domain/services/parseSrtToDialogues';
import { parseSswtToDialogues } from '$lib/domain/services/parseSswtToDialogues';
import { parseTsvToDialogues } from '$lib/domain/services/parseTsvToDialogues';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { error, info, warn } from '@tauri-apps/plugin-log';

/**
 * TSVファイルのカラム設定
 */
type TsvConfig = {
  readonly startTimeColumnIndex: number;
  readonly textColumnIndex: number;
  readonly endTimeColumnIndex?: number;
};

/**
 * 新しいエピソードを追加するためのパラメータ
 */
interface AddNewEpisodeParams {
  episodeGroupId: number;
  displayOrder: number;
  title: string;
  audioFilePath: string;
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
      audio,
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
  const { episodeGroupId, displayOrder, title, audioFilePath, scriptFilePath, tsvConfig } = params;
  const { audioFilename, scriptFilename, uuid } = await generateUniqueEpisodeFilenames(
    audioFilePath,
    scriptFilePath
  );
  try {
    // audioFilePath: string, scriptFilePath: string
    const audioPath = await fileRepository.saveAudioFile(audioFilePath, uuid, audioFilename);
    // scriptFilePathから内容を読み込む
    const scriptContent = await fileRepository.readTextFileByAbsolutePath(scriptFilePath);
    const scriptPath = await fileRepository.saveScriptFile(scriptContent, uuid, scriptFilename);
    const episode = await episodeRepository.addEpisode({
      episodeGroupId,
      displayOrder,
      title,
      audioPath,
      scriptPath,
      learningLanguage: 'English',
      explanationLanguage: 'Japanese',
    });
    try {
      // scriptFilePathの拡張子を取得
      const scriptExtension = scriptFilename.split('.').pop()?.toLowerCase();

      const supportedExtensions = ['srt', 'sswt', 'tsv'];
      if (scriptExtension === undefined || !supportedExtensions.includes(scriptExtension)) {
        throw new Error(`Unsupported script file type: ${scriptExtension}`);
      }

      let result: { dialogues: readonly NewDialogue[]; warnings: readonly string[] };

      switch (scriptExtension) {
        case 'srt':
          result = parseSrtToDialogues(scriptContent, episode.id);
          break;
        case 'sswt':
          result = parseSswtToDialogues(scriptContent, episode.id);
          break;
        case 'tsv': {
          if (tsvConfig === undefined) {
            throw new Error('TSV config is required for TSV script files.');
          }
          result = parseTsvToDialogues(scriptContent, episode.id, tsvConfig);
          break;
        }
        default:
          // This part should not be reached due to the check above, but it's good for safety.
          throw new Error(`Parser not implemented for: ${scriptExtension}`);
      }

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
