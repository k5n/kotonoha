import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';

/**
 * Reads a script file and generates a preview.
 * @param filePath The path to the script file.
 * @returns A promise that resolves to a ScriptPreview object.
 */
export async function previewScriptFile(filePath: string): Promise<ScriptPreview> {
  const content = await fileRepository.readTextFileByAbsolutePath(filePath);
  return parseScriptPreview(content, 5);
}
