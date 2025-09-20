import type { NewDialogue } from '$lib/domain/entities/dialogue';

/**
 * Parses WebVTT content and converts it into an array of Dialogue objects.
 *
 * @param vttContent The content of the WebVTT file as a string.
 * @param episodeId The ID of the episode to which these dialogues belong.
 * @returns An object containing the parsed dialogues and any warnings.
 */
export function parseVttToDialogues(
  vttContent: string,
  episodeId: number
): { dialogues: readonly NewDialogue[]; warnings: readonly string[] } {
  const dialogues: NewDialogue[] = [];
  const warnings: string[] = [];
  const normalizedContent = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.split('\n');

  if (lines[0].trim() !== 'WEBVTT') {
    warnings.push('Skipping file because it does not start with WEBVTT.');
    return { dialogues, warnings };
  }

  const blocks = normalizedContent
    .substring(lines[0].length)
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  for (const block of blocks) {
    if (block.startsWith('NOTE')) {
      continue;
    }

    const blockLines = block.split('\n').map((line) => line.trim());

    const timecodeLineIndex = blockLines.findIndex((line) =>
      /(\d{2}:)?\d{2}:\d{2}\.\d{3}\s-->\s(\d{2}:)?\d{2}:\d{2}\.\d{3}/.test(line)
    );

    if (timecodeLineIndex === -1) {
      warnings.push(`Skipping malformed VTT block: Timecode line not found. ${block}`);
      continue;
    }

    const timecodeLine = blockLines[timecodeLineIndex];
    const textLines = blockLines.slice(timecodeLineIndex + 1).filter((line) => line.length > 0);

    if (textLines.length === 0) {
      warnings.push(`Skipping malformed VTT block: No text found after timecode. ${block}`);
      continue;
    }

    const timeMatch = timecodeLine.match(
      /((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s-->\s((?:\d{2}:)?\d{2}:\d{2}\.\d{3})/
    );

    if (!timeMatch) {
      warnings.push(`Skipping VTT block due to invalid timecode format: ${block}`);
      continue;
    }

    const startTimeStr = timeMatch[1];
    const endTimeStr = timeMatch[2];

    const vttTimeToMs = (time: string): number => {
      const parts = time.split(':');
      const hasHours = parts.length === 3;
      const h = hasHours ? parseInt(parts[0]) : 0;
      const m = hasHours ? parseInt(parts[1]) : parseInt(parts[0]);
      const [s, ms] = parts[hasHours ? 2 : 1].split('.');
      return (h * 3600 + m * 60 + parseInt(s)) * 1000 + parseInt(ms);
    };

    const startTimeMs = vttTimeToMs(startTimeStr);
    const endTimeMs = vttTimeToMs(endTimeStr);
    const originalText = textLines.join('\n');

    dialogues.push({
      episodeId: episodeId,
      startTimeMs: startTimeMs,
      endTimeMs: endTimeMs,
      originalText: originalText,
    });
  }

  return { dialogues, warnings };
}
