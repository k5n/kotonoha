import { warn } from '@tauri-apps/plugin-log';
import type { Dialogue } from '../entities/dialogue';

/**
 * Parses SRT content and converts it into an array of Dialogue objects.
 *
 * @param srtContent The content of the SRT file as a string.
 * @param episodeId The ID of the episode to which these dialogues belong.
 * @returns An array of Dialogue objects.
 */
export function parseSrtToDialogues(srtContent: string, episodeId: number): Dialogue[] {
  const dialogues: Dialogue[] = [];
  const normalizedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedContent
    .split(/\n\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  for (const block of blocks) {
    const lines = block.split(/\n/).map((line) => line.trim());

    let timecodeLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(' --> ')) {
        timecodeLineIndex = i;
        break;
      }
    }

    if (timecodeLineIndex === -1 || timecodeLineIndex + 1 > lines.length) {
      warn(
        `Skipping malformed SRT block: Timecode line not found or no text following it. ${block}`
      );
      continue;
    }

    const timecodeLine = lines[timecodeLineIndex];
    const textLines = lines.slice(timecodeLineIndex + 1);

    const timeMatch = timecodeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

    if (!timeMatch) {
      warn(`Skipping SRT block due to invalid timecode format: ${block}`);
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
