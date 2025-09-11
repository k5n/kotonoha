import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';

/**
 * Reads a script file and generates a preview.
 * @param file The script file object selected by the user.
 * @returns A promise that resolves to a ScriptPreview object.
 */
export async function previewScriptFile(file: File): Promise<ScriptPreview> {
  const content = await file.text();
  return parseScriptPreview(content, 5);
}
