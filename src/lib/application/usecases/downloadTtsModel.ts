import type { DownloadProgress } from '$lib/domain/entities/ttsEvent';
import type { FileInfo } from '$lib/domain/entities/voice';
import { ttsRepository } from '$lib/infrastructure/repositories/ttsRepository';

/**
 * Gets the list of files that need to be downloaded.
 * @param modelFiles The model files to check.
 * @param baseUrl The base URL for the files.
 * @param isDownloadedChecker Function to check if a file is already downloaded.
 * @returns Promise resolving to the list of files to download.
 */
async function getDownloadTasks(
  modelFiles: readonly FileInfo[],
  isDownloadedChecker: (file: FileInfo) => Promise<boolean>
): Promise<readonly FileInfo[]> {
  const downloadTasks: FileInfo[] = [];
  for (const file of modelFiles) {
    const isDownloaded = await isDownloadedChecker(file);
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
  downloader: (file: FileInfo, downloadId: string) => Promise<void>
): Promise<void> {
  const downloadPromises = downloadTasks.map(async (file) => {
    try {
      // use the relative path as a stable download id
      const downloadId = file.path;
      await downloader(file, downloadId);
    } catch (error) {
      throw new Error(`Failed to download ${file.url}: ${error}`);
    }
  });

  const results = await Promise.allSettled(downloadPromises);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length > 0) {
    throw new Error(`${failures.length} file(s) failed to download`);
  }
}

export async function createDownloadTasks(
  modelFiles: readonly FileInfo[]
): Promise<readonly FileInfo[]> {
  return getDownloadTasks(modelFiles, ttsRepository.isModelDownloaded.bind(ttsRepository));
}

/**
 * Download TTS model if not already downloaded.
 * Gets the currently selected voice and speaker from the store.
 *
 * @throws Error if download fails
 */
export async function downloadTtsModel(
  downloadTasks: readonly FileInfo[],
  updateProgress: (progress: DownloadProgress) => void
): Promise<void> {
  const totalBytes = downloadTasks.reduce((sum, file) => sum + file.bytes, 0);
  const progressUnlisten = await ttsRepository.listenDownloadProgress((payload) => {
    const fileProgress = new Map<string, number>();
    fileProgress.set(payload.fileName, payload.downloaded);

    // Calculate overall progress
    const { overallProgress, totalDownloaded } = calculateTotalProgress(
      downloadTasks,
      fileProgress
    );

    updateProgress({
      downloadId: '',
      fileName: `${fileProgress.size}/${downloadTasks.length} files`,
      progress: overallProgress,
      downloaded: totalDownloaded,
      total: totalBytes,
    });
  });

  try {
    await executeDownloads(downloadTasks, ttsRepository.downloadModel.bind(ttsRepository));
  } finally {
    progressUnlisten();
  }
}

export async function cancelTtsModelDownload(downloadIds: readonly string[]): Promise<void> {
  for (const id of downloadIds) {
    try {
      await ttsRepository.cancelDownload(id);
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  }
}
