import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
import { ttsDownloadStore } from '$lib/application/stores/episodeAddStore/ttsDownloadStore.svelte';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';

/**
 * Download TTS model if not already downloaded.
 * Gets the currently selected voice and speaker from the store.
 *
 * @throws Error if no voice/speaker is selected or download fails
 */
export async function downloadTtsModel(): Promise<void> {
  const selectedVoice = ttsConfigStore.selectedVoice;

  if (!selectedVoice) {
    throw new Error('No voice selected');
  }

  // Get all model files
  const modelFiles = selectedVoice.files;
  if (modelFiles.length === 0) {
    throw new Error('No voice model files found');
  }

  // Get base URL from the learningTargetVoices
  const baseUrl = ttsConfigStore.learningTargetVoices?.baseUrl;
  if (!baseUrl) {
    throw new Error('Base URL for voice files not found');
  }

  // Check which files need to be downloaded
  const downloadTasks = [];
  for (const file of modelFiles) {
    const isDownloaded = await ttsRepository.isModelDownloaded(file, baseUrl);
    if (!isDownloaded) {
      downloadTasks.push(file);
    }
  }

  if (downloadTasks.length === 0) {
    return; // All files already downloaded
  }

  // Calculate total size for progress tracking
  const totalBytes = downloadTasks.reduce((sum, file) => sum + file.bytes, 0);
  let totalDownloaded = 0;
  const fileProgress = new Map<string, number>();

  // Open modal and listen for download progress
  ttsDownloadStore.openModal();
  const progressUnlisten = await ttsRepository.listenDownloadProgress((payload) => {
    // Update progress for the specific file
    fileProgress.set(payload.fileName, payload.downloaded);

    // Calculate total progress across all files
    totalDownloaded = Array.from(fileProgress.values()).reduce(
      (sum, downloaded) => sum + downloaded,
      0
    );
    const overallProgress = totalBytes > 0 ? Math.round((totalDownloaded / totalBytes) * 100) : 0;

    ttsDownloadStore.updateProgress({
      fileName: `${Array.from(fileProgress.keys()).length}/${downloadTasks.length} files`,
      progress: overallProgress,
      downloaded: totalDownloaded,
      total: totalBytes,
    });
  });

  try {
    // Download all files in parallel
    await Promise.all(downloadTasks.map((file) => ttsRepository.downloadModel(file, baseUrl)));
  } finally {
    // Stop listening for progress and close modal
    progressUnlisten();
    ttsDownloadStore.closeModal();
  }
}
