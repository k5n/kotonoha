import type { NewDialogue } from '$lib/domain/entities/dialogue';

/**
 * Parses a time string in various formats (HH:MM:SS.ms, MM:SS.ms, SS.ms, with optional 's' suffix)
 * and converts it to milliseconds.
 * @param timeStr The time string to parse.
 * @returns The time in milliseconds, or null if the format is invalid.
 */
function parseTimeToMilliseconds(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const cleanedTimeStr = timeStr.trim().toLowerCase().replace(/s$/, '');
  if (cleanedTimeStr === '') {
    return null;
  }

  const parts = cleanedTimeStr.split(':').map(Number);

  if (parts.some(isNaN)) {
    return null;
  }

  let totalSeconds = 0;
  if (parts.length === 1) {
    // SS.ms
    totalSeconds = parts[0];
  } else if (parts.length === 2) {
    // MM:SS.ms
    totalSeconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS.ms
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else {
    return null;
  }

  return Math.round(totalSeconds * 1000);
}

type TsvConfig = {
  readonly startTimeColumnIndex: number;
  readonly textColumnIndex: number;
  readonly endTimeColumnIndex?: number;
};

/**
 * Parses TSV content and converts it into an array of Dialogue objects.
 *
 * @param tsvContent The content of the TSV file as a string.
 * @param episodeId The ID of the episode to which these dialogues belong.
 * @param config Configuration for the TSV columns.
 * @returns An object containing the parsed dialogues and any warnings.
 */
export function parseTsvToDialogues(
  tsvContent: string,
  episodeId: number,
  config: TsvConfig
): { dialogues: readonly NewDialogue[]; warnings: readonly string[] } {
  const dialogues: NewDialogue[] = [];
  const warnings: string[] = [];

  const lines = tsvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Skip header
  const dataLines = lines.slice(1);

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const lineNumber = i + 2; // 1-based index + 1 for header

    if (line.trim() === '') {
      continue;
    }

    const columns = line.split('\t');

    const { startTimeColumnIndex, textColumnIndex, endTimeColumnIndex } = config;

    if (
      columns.length <= startTimeColumnIndex ||
      columns.length <= textColumnIndex ||
      (endTimeColumnIndex !== undefined && columns.length <= endTimeColumnIndex)
    ) {
      warnings.push(`Skipping line ${lineNumber}: Not enough columns.`);
      continue;
    }

    const startTimeStr = columns[startTimeColumnIndex];
    const startTimeMs = parseTimeToMilliseconds(startTimeStr);

    if (startTimeMs === null) {
      warnings.push(`Skipping line ${lineNumber}: Invalid start time format "${startTimeStr}".`);
      continue;
    }

    let endTimeMs: number | null;
    if (endTimeColumnIndex !== undefined) {
      const endTimeStr = columns[endTimeColumnIndex];
      if (endTimeStr && endTimeStr.trim() !== '') {
        const parsedEndTime = parseTimeToMilliseconds(endTimeStr);
        if (parsedEndTime === null) {
          warnings.push(
            `Warning on line ${lineNumber}: Invalid end time format "${endTimeStr}". Defaulting to null.`
          );
          endTimeMs = null;
        } else {
          endTimeMs = parsedEndTime;
        }
      } else {
        endTimeMs = startTimeMs;
      }
    } else {
      endTimeMs = startTimeMs;
    }

    const originalText = columns[textColumnIndex];
    if (!originalText || originalText.trim() === '') {
      warnings.push(`Skipping line ${lineNumber}: Text column is empty.`);
      continue;
    }

    dialogues.push({
      episodeId,
      startTimeMs,
      endTimeMs,
      originalText: originalText.trim(),
    });
  }

  return { dialogues, warnings };
}
