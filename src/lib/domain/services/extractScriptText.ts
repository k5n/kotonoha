import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { parseScriptToSubtitleLines } from '$lib/domain/services/parseScriptToSubtitleLines';
import { parseTsvToText } from '$lib/domain/services/parseTsvToText';
import { assertNotUndefined } from '$lib/utils/assertion';

/**
 * Extracts text content from script files, removing timestamps and focusing on the main text.
 *
 * @param scriptContent The content of the script file as a string.
 * @param scriptExtension The file extension (e.g., 'srt', 'vtt', 'sswt', 'tsv', 'txt').
 * @param tsvConfig Configuration for TSV files, required if scriptExtension is 'tsv'.
 * @returns The extracted text content joined by newlines.
 * @throws Error if the extension is unsupported or required config is missing.
 */
export function extractScriptText(
  scriptContent: string,
  scriptExtension: string,
  tsvConfig?: TsvConfig
): string {
  const supportedExtensions = ['srt', 'vtt', 'sswt', 'tsv', 'txt'];
  if (!supportedExtensions.includes(scriptExtension)) {
    throw new Error(`Unsupported script file type: ${scriptExtension}`);
  }

  switch (scriptExtension) {
    case 'txt':
      return scriptContent;
    case 'srt':
    case 'vtt':
    case 'sswt': {
      const { subtitleLines } = parseScriptToSubtitleLines(
        scriptContent,
        scriptExtension,
        'dummy-episode'
      ); // episodeId is dummy
      return subtitleLines.map((d) => d.originalText).join('\n');
    }
    case 'tsv': {
      assertNotUndefined(tsvConfig, 'TSV config is required for TSV script files.');
      return parseTsvToText(scriptContent, tsvConfig);
    }
    default:
      throw new Error(`Parser not implemented for: ${scriptExtension}`);
  }
}
