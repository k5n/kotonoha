import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { parseScriptPreview } from '$lib/domain/services/parseScriptPreview';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';

/**
 * Reads a script file and generates a preview.
 * @param filePath The path to the script file.
 */
export async function previewScriptFile(filePath: string): Promise<void> {
  fileEpisodeAddStore.tsv.startScriptPreviewFetching();
  try {
    const content = await fileRepository.readTextFileByAbsolutePath(filePath);
    const preview = parseScriptPreview(content, 5);
    fileEpisodeAddStore.tsv.completeScriptPreviewFetching(preview);
  } catch (e) {
    fileEpisodeAddStore.tsv.failedScriptPreviewFetching('components.fileEpisodeForm.errorTsvParse');
    throw e;
  }
}
