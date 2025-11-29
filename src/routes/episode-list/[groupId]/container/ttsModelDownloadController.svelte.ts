import {
  cancelTtsModelDownload,
  createDownloadTasks,
  downloadTtsModel,
} from '$lib/application/usecases/downloadTtsModel';
import type { DownloadProgress } from '$lib/domain/entities/ttsEvent';
import type { FileInfo } from '$lib/domain/entities/voice';

export type TtsModelDownloadController = {
  readonly open: boolean;
  readonly progress: DownloadProgress;
  readonly isDownloading: boolean;
  readonly errorMessageKey: string;
  start: (files: readonly FileInfo[]) => Promise<void>;
  cancel: () => Promise<void>;
  close: () => void;
  reset: () => void;
};

const initialProgress: DownloadProgress = {
  downloadId: '',
  fileName: '',
  progress: 0,
  downloaded: 0,
  total: 0,
};

export function createTtsModelDownloadController(): TtsModelDownloadController {
  let open = $state(false);
  let tasks = $state<readonly FileInfo[]>([]);
  let progress = $state<DownloadProgress>(initialProgress);
  let isDownloading = $state(false);
  let errorMessageKey = $state('');

  function openModal() {
    open = true;
    isDownloading = true;
    errorMessageKey = '';
    progress = initialProgress;
  }

  function closeModal() {
    open = false;
    isDownloading = false;
    errorMessageKey = '';
    progress = initialProgress;
    tasks = [];
  }

  function handleFailed(messageKey: string) {
    errorMessageKey = messageKey;
    isDownloading = false;
  }

  function updateProgress(newProgress: DownloadProgress) {
    progress = newProgress;
  }

  async function start(files: readonly FileInfo[]): Promise<void> {
    try {
      tasks = await createDownloadTasks(files);
      if (tasks.length === 0) {
        return;
      }
      openModal();
      await downloadTtsModel(tasks, updateProgress);
      closeModal();
    } catch (error) {
      console.error('Failed to download TTS model:', error);
      handleFailed('components.ttsModelDownloadModal.error.downloadFailed');
      throw error;
    }
  }

  async function cancel(): Promise<void> {
    try {
      if (tasks.length === 0) {
        return;
      }
      const downloadIds = tasks.map((file) => file.path);
      await cancelTtsModelDownload(downloadIds);
    } finally {
      closeModal();
    }
  }

  function reset() {
    closeModal();
  }

  return {
    get open() {
      return open;
    },
    get progress() {
      return progress;
    },
    get isDownloading() {
      return isDownloading;
    },
    get errorMessageKey() {
      return errorMessageKey;
    },
    start,
    cancel,
    close: closeModal,
    reset,
  };
}
