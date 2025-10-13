import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';

/**
 * Reads a script file and generates a preview.
 * @param filePath The path to the script file.
 */
export async function previewScriptFile(filePath: string): Promise<void> {
  episodeAddStore.file.tsv.startScriptPreviewFetching();
  try {
    const content = await fileRepository.readTextFileByAbsolutePath(filePath);
    const preview = parseScriptPreview(content, 5);
    episodeAddStore.file.tsv.completeScriptPreviewFetching(preview);
  } catch (e) {
    episodeAddStore.file.tsv.failedScriptPreviewFetching(
      'components.episodeAddModal.errorTsvParse'
    );
    throw e;
  }
}
