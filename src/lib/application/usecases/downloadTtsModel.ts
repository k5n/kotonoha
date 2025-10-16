import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
import { ttsDownloadStore } from '$lib/application/stores/episodeAddStore/ttsDownloadStore.svelte';
import type { FileInfo, Voice } from '$lib/domain/entities/voice';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';

/**
 * Custom error for TTS download operations.
 */
export class TtsDownloadError extends Error {
  constructor(
    message: string,
    public readonly type: 'validation' | 'download' | 'network'
  ) {
    super(message);
    this.name = 'TtsDownloadError';
  }
}

/**
 * Validates the selected voice and its model files.
 * @param selectedVoice The selected voice to validate.
 * @throws TtsDownloadError if validation fails.
 */
function validateSelectedVoice(selectedVoice: Voice | null): asserts selectedVoice is Voice {
  if (!selectedVoice) {
    throw new TtsDownloadError('No voice selected', 'validation');
  }

  if (selectedVoice.files.length === 0) {
    throw new TtsDownloadError('No voice model files found', 'validation');
  }
}

/**
 * Gets the list of files that need to be downloaded.
 * @param modelFiles The model files to check.
 * @param baseUrl The base URL for the files.
 * @param isDownloadedChecker Function to check if a file is already downloaded.
 * @returns Promise resolving to the list of files to download.
 */
async function getDownloadTasks(
  modelFiles: readonly FileInfo[],
  baseUrl: string,
  isDownloadedChecker: (file: FileInfo, baseUrl: string) => Promise<boolean>
): Promise<readonly FileInfo[]> {
  const downloadTasks: FileInfo[] = [];
  for (const file of modelFiles) {
    const isDownloaded = await isDownloadedChecker(file, baseUrl);
    if (!isDownloaded) {
      downloadTasks.push(file);
    }
  }
  return downloadTasks;
}

/**
 * Calculates the total progress across all download tasks.
 * @param downloadTasks The list of files being downloaded.
 * @param fileProgress Map of file names to their downloaded bytes.
 * @returns Object with overall progress percentage and total downloaded bytes.
 */
function calculateTotalProgress(
  downloadTasks: readonly FileInfo[],
  fileProgress: Map<string, number>
): { overallProgress: number; totalDownloaded: number } {
  const totalBytes = downloadTasks.reduce((sum, file) => sum + file.bytes, 0);
  const totalDownloaded = Array.from(fileProgress.values()).reduce(
    (sum, downloaded) => sum + downloaded,
    0
  );
  const overallProgress = totalBytes > 0 ? Math.round((totalDownloaded / totalBytes) * 100) : 0;
  return { overallProgress, totalDownloaded };
}

/**
 * Executes the download of all tasks in parallel.
 * @param downloadTasks The files to download.
 * @param baseUrl The base URL for the files.
 * @param downloader Function to download a single file.
 */
async function executeDownloads(
  downloadTasks: readonly FileInfo[],
  baseUrl: string,
  downloader: (file: FileInfo, baseUrl: string, downloadId: string) => Promise<void>
): Promise<void> {
  const downloadPromises = downloadTasks.map(async (file) => {
    try {
      const downloadId = file.url;
      ttsDownloadStore.setDownloadId(downloadId);
      await downloader(file, baseUrl, downloadId);
    } catch (error) {
      throw new TtsDownloadError(`Failed to download ${file.url}: ${error}`, 'download');
    }
  });

  const results = await Promise.allSettled(downloadPromises);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length > 0) {
    throw new TtsDownloadError(`${failures.length} file(s) failed to download`, 'download');
  }
}

/**
 * Download TTS model if not already downloaded.
 * Gets the currently selected voice and speaker from the store.
 *
 * @throws TtsDownloadError if no voice/speaker is selected or download fails
 */
export async function downloadTtsModel(): Promise<void> {
  const selectedVoice = ttsConfigStore.selectedVoice;
  const baseUrl = ttsConfigStore.learningTargetVoices?.baseUrl;

  validateSelectedVoice(selectedVoice);
  if (!baseUrl) {
    throw new TtsDownloadError('Base URL for voice files not found', 'validation');
  }

  const downloadTasks = await getDownloadTasks(
    selectedVoice.files,
    baseUrl,
    ttsRepository.isModelDownloaded.bind(ttsRepository)
  );

  if (downloadTasks.length === 0) {
    return; // All files already downloaded
  }

  const totalBytes = downloadTasks.reduce((sum, file) => sum + file.bytes, 0);

  ttsDownloadStore.openModal();
  const progressUnlisten = await ttsRepository.listenDownloadProgress((payload) => {
    // Update file progress
    const fileProgress = new Map<string, number>();
    fileProgress.set(payload.fileName, payload.downloaded);

    // Calculate overall progress
    const { overallProgress, totalDownloaded } = calculateTotalProgress(
      downloadTasks,
      fileProgress
    );

    ttsDownloadStore.updateProgress({
      downloadId: '',
      fileName: `${fileProgress.size}/${downloadTasks.length} files`,
      progress: overallProgress,
      downloaded: totalDownloaded,
      total: totalBytes,
    });
  });

  try {
    await executeDownloads(downloadTasks, baseUrl, ttsRepository.downloadModel.bind(ttsRepository));
  } finally {
    progressUnlisten();
    ttsDownloadStore.closeModal();
  }
}
