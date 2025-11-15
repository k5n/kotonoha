import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';

/**
 * Reads a script file and generates a preview.
 * @param filePath The path to the script file.
 */
export async function previewScriptFile(filePath: string): Promise<void> {
  tsvConfigStore.startScriptPreviewFetching();
  try {
    const content = await fileRepository.readTextFileByAbsolutePath(filePath);
    const preview = parseScriptPreview(content, 5);
    tsvConfigStore.completeScriptPreviewFetching(preview);
  } catch (e) {
    tsvConfigStore.failedScriptPreviewFetching('components.fileEpisodeForm.errorTsvParse');
    throw e;
  }
}
