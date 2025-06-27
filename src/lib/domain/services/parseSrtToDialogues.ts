import type { Dialogue } from '$lib/domain/entities/dialogue';
import type { Logger } from '$lib/domain/utils/logger';

/**
 * Parses SRT content and converts it into an array of Dialogue objects.
 *
 * @param srtContent The content of the SRT file as a string.
 * @param episodeId The ID of the episode to which these dialogues belong.
 * @returns An array of Dialogue objects.
 */
export function parseSrtToDialogues(
  srtContent: string,
  episodeId: number,
  logger: Logger
): Dialogue[] {
  const dialogues: Dialogue[] = [];
  const normalizedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedContent
    .split(/\n{2,}/) // 2つ以上の連続した改行で分割
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  for (const block of blocks) {
    const lines = block.split(/\n/).map((line) => line.trim());

    const timecodeLineIndex = lines.findIndex((line) =>
      /^\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}$/.test(line)
    );

    if (timecodeLineIndex === -1 || timecodeLineIndex + 1 > lines.length) {
      logger.warn(
        `Skipping malformed SRT block: Timecode line not found or no text following it. ${block}`
      );
      continue;
    }

    const timecodeLine = lines[timecodeLineIndex];
    const textLines = lines.slice(timecodeLineIndex + 1).filter((line) => line.length > 0);

    const timeMatch = timecodeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

    if (!timeMatch) {
      logger.warn(`Skipping SRT block due to invalid timecode format: ${block}`);
      continue;
    }

    const startTimeStr = timeMatch[1];
    const endTimeStr = timeMatch[2];

    const srtTimeToMs = (time: string): number => {
      const [h, m, s_ms] = time.split(':');
      const [s, ms] = s_ms.split(',');
      return (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)) * 1000 + parseInt(ms);
    };

    const startTimeMs = srtTimeToMs(startTimeStr);
    const endTimeMs = srtTimeToMs(endTimeStr);
    const originalText = textLines.join('\n');

    dialogues.push({
      id: 0, // Placeholder, will be assigned by DB
      episodeId: episodeId,
      startTimeMs: startTimeMs,
      endTimeMs: endTimeMs,
      originalText: originalText,
      correctedText: null,
    });
  }

  return dialogues;
}
