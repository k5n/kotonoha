import type { NewSubtitleLine, SubtitleLineParseResult } from '$lib/domain/entities/subtitleLine';

/**
 * Parses SRT content and converts it into an array of SubtitleLine objects.
 *
 * @param srtContent The content of the SRT file as a string.
 * @param episodeId The ID of the episode to which these script segments belong.
 * @returns An object containing the parsed subtitleLines and any warnings.
 */
export function parseSrtToSubtitleLines(
  srtContent: string,
  episodeId: string
): SubtitleLineParseResult {
  const subtitleLines: NewSubtitleLine[] = [];
  const warnings: string[] = [];
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
      warnings.push(
        `Skipping malformed SRT block: Timecode line not found or no text following it. ${block}`
      );
      continue;
    }

    const timecodeLine = lines[timecodeLineIndex];
    const textLines = lines.slice(timecodeLineIndex + 1).filter((line) => line.length > 0);

    const timeMatch = timecodeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

    if (!timeMatch) {
      warnings.push(`Skipping SRT block due to invalid timecode format: ${block}`);
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

    subtitleLines.push({
      episodeId: episodeId,
      startTimeMs: startTimeMs,
      endTimeMs: endTimeMs,
      originalText: originalText,
    });
  }

  return { subtitleLines, warnings };
}
