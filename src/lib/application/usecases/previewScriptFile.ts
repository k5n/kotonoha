import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';

/**
 * Reads a script file and generates a preview.
 * @param file The script file object selected by the user.
 * @param hasHeader Whether the first row is a header.
 * @returns A promise that resolves to a ScriptPreview object.
 */
export async function previewScriptFile(file: File, hasHeader: boolean): Promise<ScriptPreview> {
  const content = await file.text();
  // Note: In the future, we might support CSV, so we could determine the delimiter
  // based on the file extension or content.
  const delimiter = '	';
  return parseScriptPreview(content, hasHeader, 5, delimiter);
}
