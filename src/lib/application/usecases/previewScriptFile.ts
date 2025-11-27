import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';

/**
 * Reads a script file and generates a preview.
 * @param filePath The path to the script file.
 */
export async function previewScriptFile(filePath: string): Promise<ScriptPreview> {
  const content = await fileRepository.readTextFileByAbsolutePath(filePath);
  const preview = parseScriptPreview(content, 5);
  if (preview.rows.length === 0) {
    console.error('TSV file is empty or has no data rows.');
    throw new Error('TSV file is empty or has no data rows.');
  }
  return preview;
}
