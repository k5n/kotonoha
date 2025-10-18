import type { NewDialogue } from '$lib/domain/entities/dialogue';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { parseSrtToDialogues } from '$lib/domain/services/parseSrtToDialogues';
import { parseSswtToDialogues } from '$lib/domain/services/parseSswtToDialogues';
import { parseTsvToDialogues } from '$lib/domain/services/parseTsvToDialogues';
import { parseVttToDialogues } from '$lib/domain/services/parseVttToDialogues';

/**
 * スクリプトファイルの内容を拡張子に基づいてダイアログにパースする
 *
 * @param scriptContent - スクリプトファイルの内容
 * @param scriptExtension - スクリプトファイルの拡張子（小文字）
 * @param episodeId - エピソードID
 * @param tsvConfig - TSVファイルの場合の設定（オプション）
 * @returns パース結果のダイアログと警告
 * @throws サポートされていない拡張子の場合にエラーをスロー
 */
export function parseScriptToDialogues(
  scriptContent: string,
  scriptExtension: string,
  episodeId: number,
  tsvConfig?: TsvConfig
): { dialogues: readonly NewDialogue[]; warnings: readonly string[] } {
  const supportedExtensions = ['srt', 'sswt', 'tsv', 'vtt'];
  if (!supportedExtensions.includes(scriptExtension)) {
    throw new Error(`Unsupported script file type: ${scriptExtension}`);
  }

  switch (scriptExtension) {
    case 'srt':
      return parseSrtToDialogues(scriptContent, episodeId);
    case 'sswt':
      return parseSswtToDialogues(scriptContent, episodeId);
    case 'tsv': {
      if (tsvConfig === undefined) {
        throw new Error('TSV config is required for TSV script files.');
      }
      return parseTsvToDialogues(scriptContent, episodeId, tsvConfig);
    }
    case 'vtt':
      return parseVttToDialogues(scriptContent, episodeId);
    default:
      // This part should not be reached due to the check above, but it's good for safety.
      throw new Error(`Parser not implemented for: ${scriptExtension}`);
  }
}
