import type { DownloadProgress } from '$lib/domain/entities/ttsEvent';

let showModal = $state(false);
let progress = $state<DownloadProgress>({
  fileName: '',
  progress: 0,
  downloaded: 0,
  total: 0,
});

function openModal() {
  showModal = true;
}

function closeModal() {
  showModal = false;
}

function updateProgress(newProgress: DownloadProgress) {
  progress = newProgress;
}

function reset() {
  showModal = false;
  progress = {
    fileName: '',
    progress: 0,
    downloaded: 0,
    total: 0,
  };
}

export const ttsDownloadStore = {
  get showModal() {
    return showModal;
  },
  get progress() {
    return progress;
  },
  openModal,
  closeModal,
  updateProgress,
  reset,
};
