import type { NewDialogue } from '$lib/domain/entities/dialogue';

const sswtLineRegex = /^\[(\d{2}:\d{2}:\d{2}\.\d{3}) -> (\d{2}:\d{2}:\d{2}\.\d{3})\]\s*(.*)$/;

/**
 * Parses a time string (HH:MM:SS.ms) into milliseconds.
 * @param timeString The time string to parse.
 * @returns The time in milliseconds. (returns null if the format is invalid)
 */
function parseTimeToMs(timeString: string): number | null {
  const timeParts = timeString.split(':');
  if (timeParts.length !== 3) return null;
  const hours = parseInt(timeParts[0], 10);
  if (hours < 0 || hours > 23) return null; // Validate hours
  const minutes = parseInt(timeParts[1], 10);
  if (minutes < 0 || minutes > 59) return null; // Validate minutes
  const secMsParts = timeParts[2].split('.');
  if (secMsParts.length < 1) return null;
  const seconds = parseInt(secMsParts[0], 10);
  if (seconds < 0 || seconds > 59) return null; // Validate seconds
  if (secMsParts.length !== 2 || secMsParts[1].length !== 3) return null;
  const milliseconds = parseInt(secMsParts[1], 10);
  if ([hours, minutes, seconds, milliseconds].some((v) => isNaN(v))) return null;
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

/**
 * Parses the content of an SSWT (Simple Subtitle With Timestamp) file into an array of Dialogue objects.
 *
 * Each line in an SSWT file is expected to be in the format:
 * `[HH:MM:SS.ms -> HH:MM:SS.ms] Your subtitle text here.`
 *
 * @param sswtContent The content of the SSWT file as a string.
 * @returns An object containing the parsed dialogues and any warnings.
 */
export function parseSswtToDialogues(
  sswtContent: string,
  episodeId: number
): { dialogues: readonly NewDialogue[]; warnings: readonly string[] } {
  const dialogues: NewDialogue[] = [];
  const warnings: string[] = [];
  const lines = sswtContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(sswtLineRegex);
    if (!match) {
      if (line.trim().length > 0) {
        warnings.push(`Line ${i + 1}: Invalid SSWT format. Skipped. Content: "${line}"`);
      }
      continue;
    }
    const startTimeString = match[1];
    const endTimeString = match[2];
    const originalText = match[3].trim();

    const startTimeMs = parseTimeToMs(startTimeString);
    const endTimeMs = parseTimeToMs(endTimeString);

    if (startTimeMs === null || endTimeMs === null) {
      warnings.push(`Line ${i + 1}: Invalid time format. Skipped. Content: "${line}"`);
      continue;
    }

    dialogues.push({
      episodeId,
      startTimeMs,
      endTimeMs,
      originalText,
    });
  }

  return { dialogues, warnings };
}
