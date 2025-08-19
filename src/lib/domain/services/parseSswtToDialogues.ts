import type { Dialogue } from '$lib/domain/entities/dialogue';

/**
 * Parses a time string (HH:MM:SS.ms) into milliseconds.
 * @param timeString The time string to parse.
 * @returns The time in milliseconds.
 */
function parseTimeToMs(timeString: string): number {
  const parts = timeString.split(/[:,.]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const milliseconds = parseInt(parts[3], 10);
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

/**
 * Parses the content of an SSWT (Simple Subtitle With Timestamp) file into an array of Dialogue objects.
 *
 * Each line in an SSWT file is expected to be in the format:
 * `[HH:MM:SS.ms -> HH:MM:SS.ms] Your subtitle text here.`
 *
 * @param sswtContent The content of the SSWT file as a string.
 * @returns A readonly array of Dialogue objects.
 */
export function parseSswtToDialogues(sswtContent: string, episodeId: number): readonly Dialogue[] {
  const dialogues: Dialogue[] = [];
  const lines = sswtContent.split('\n');

  const sswtLineRegex = /^\[(\d{2}:\d{2}:\d{2}\.\d{3}) -> (\d{2}:\d{2}:\d{2}\.\d{3})\]\s*(.*)$/;

  for (const line of lines) {
    const match = line.match(sswtLineRegex);
    if (match) {
      const startTimeString = match[1];
      const endTimeString = match[2];
      const originalText = match[3].trim();

      const startTimeMs = parseTimeToMs(startTimeString);
      const endTimeMs = parseTimeToMs(endTimeString);

      dialogues.push({
        id: 0, // Placeholder, will be assigned by DB
        episodeId,
        startTimeMs,
        endTimeMs,
        originalText,
        correctedText: originalText, // Initially, corrected text is the same as original
        translation: null,
        explanation: null,
      });
    }
  }

  return dialogues;
}
