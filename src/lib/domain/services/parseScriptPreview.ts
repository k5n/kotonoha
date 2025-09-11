import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';

/**
 * Parses the beginning of a script file content for preview.
 * @param content The script file content as a string.
 * @param hasHeader Whether the first row is a header.
 * @param rowCount The number of data rows to preview.
 * @param delimiter The delimiter to split columns.
 * @returns A ScriptPreview object.
 */
export function parseScriptPreview(
  content: string,
  hasHeader: boolean,
  rowCount: number = 5,
  delimiter: string = '\t'
): ScriptPreview {
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: null, rows: [] };
  }

  if (hasHeader) {
    const headerLine = lines[0];
    const headers = headerLine.split(delimiter).map((cell) => cell.trim());
    const dataLines = lines.slice(1, rowCount + 1);
    const rows = dataLines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
    return { headers, rows };
  } else {
    const dataLines = lines.slice(0, rowCount);
    const rows = dataLines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
    return { headers: null, rows };
  }
}
