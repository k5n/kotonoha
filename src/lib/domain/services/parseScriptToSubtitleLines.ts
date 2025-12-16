import type { SubtitleLineParseResult } from '$lib/domain/entities/subtitleLine';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { parseSrtToSubtitleLines } from '$lib/domain/services/parseSrtToSubtitleLines';
import { parseSswtToSubtitleLines } from '$lib/domain/services/parseSswtToSubtitleLines';
import { parseTsvToSubtitleLines } from '$lib/domain/services/parseTsvToSubtitleLines';
import { parseVttToSubtitleLines } from '$lib/domain/services/parseVttToSubtitleLines';

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
export function parseScriptToSubtitleLines(
  scriptContent: string,
  scriptExtension: string,
  episodeId: string,
  tsvConfig?: TsvConfig
): SubtitleLineParseResult {
  const supportedExtensions = ['srt', 'sswt', 'tsv', 'vtt'];
  if (!supportedExtensions.includes(scriptExtension)) {
    throw new Error(`Unsupported script file type: ${scriptExtension}`);
  }

  switch (scriptExtension) {
    case 'srt':
      return parseSrtToSubtitleLines(scriptContent, episodeId);
    case 'sswt':
      return parseSswtToSubtitleLines(scriptContent, episodeId);
    case 'tsv': {
      if (tsvConfig === undefined) {
        throw new Error('TSV config is required for TSV script files.');
      }
      return parseTsvToSubtitleLines(scriptContent, episodeId, tsvConfig);
    }
    case 'vtt':
      return parseVttToSubtitleLines(scriptContent, episodeId);
    default:
      // This part should not be reached due to the check above, but it's good for safety.
      throw new Error(`Parser not implemented for: ${scriptExtension}`);
  }
}
