import type { TsvConfig } from '$lib/domain/entities/tsvConfig';

/**
 * Parses TSV content and extracts text from the specified text column.
 * Ignores time-related columns and focuses only on the text content.
 *
 * @param tsvContent The content of the TSV file as a string.
 * @param config Configuration for the TSV columns, specifically textColumnIndex.
 * @returns The extracted text content joined by newlines.
 * @throws Error if textColumnIndex is invalid or TSV parsing fails.
 */
export function parseTsvToText(tsvContent: string, config: TsvConfig): string {
  if (config.textColumnIndex < 0) {
    throw new Error('Invalid textColumnIndex: must be 0 or greater.');
  }

  const lines = tsvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Skip header
  const dataLines = lines.slice(1);

  const texts: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];

    if (line.trim() === '') {
      continue;
    }

    const columns = line.split('\t');

    if (columns.length <= config.textColumnIndex) {
      throw new Error(
        `Line ${i + 2}: Not enough columns for textColumnIndex ${config.textColumnIndex}.`
      );
    }

    const text = columns[config.textColumnIndex];
    if (text && text.trim() !== '') {
      texts.push(text.trim());
    }
  }

  return texts.join('\n');
}
