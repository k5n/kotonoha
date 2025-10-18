import type { DownloadProgress } from '$lib/domain/entities/ttsEvent';
import { invoke } from '@tauri-apps/api/core';

let showModal = $state(false);
let progress = $state<DownloadProgress>({
  downloadId: '',
  fileName: '',
  progress: 0,
  downloaded: 0,
  total: 0,
});
let isDownloading = $state(false);
let errorMessageKey = $state('');
const downloadIds = $state<Set<string>>(new Set());

function openModal() {
  showModal = true;
  isDownloading = true;
  errorMessageKey = '';
}

function closeModal() {
  showModal = false;
  downloadIds.clear();
  isDownloading = false;
  errorMessageKey = '';
}

function updateProgress(newProgress: DownloadProgress) {
  progress = newProgress;
}

function failedDownload(key: string) {
  errorMessageKey = key;
  isDownloading = false;
}

function setDownloadId(downloadId: string) {
  downloadIds.add(downloadId);
}

async function cancelDownload() {
  const ids = Array.from(downloadIds);
  downloadIds.clear();
  for (const id of ids) {
    try {
      await invoke('cancel_download', { downloadId: id });
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  }
}

function reset() {
  showModal = false;
  progress = {
    downloadId: '',
    fileName: '',
    progress: 0,
    downloaded: 0,
    total: 0,
  };
  downloadIds.clear();
  isDownloading = false;
  errorMessageKey = '';
}

export const ttsDownloadStore = {
  get showModal() {
    return showModal;
  },
  get progress() {
    return progress;
  },
  get downloadIds() {
    return downloadIds;
  },
  get isDownloading() {
    return isDownloading;
  },
  get errorMessageKey() {
    return errorMessageKey;
  },
  openModal,
  closeModal,
  updateProgress,
  setDownloadId,
  cancelDownload,
  failedDownload,
  reset,
};
