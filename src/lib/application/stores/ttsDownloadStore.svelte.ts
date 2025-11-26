import type { DownloadProgress } from '$lib/domain/entities/ttsEvent';

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

function openModal() {
  showModal = true;
  isDownloading = true;
  errorMessageKey = '';
}

function closeModal() {
  showModal = false;
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

function reset() {
  showModal = false;
  progress = {
    downloadId: '',
    fileName: '',
    progress: 0,
    downloaded: 0,
    total: 0,
  };
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
  get isDownloading() {
    return isDownloading;
  },
  get errorMessageKey() {
    return errorMessageKey;
  },
  openModal,
  closeModal,
  updateProgress,
  failedDownload,
  reset,
};
