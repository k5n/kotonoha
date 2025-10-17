import type { FileEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
import { ttsDownloadStore } from './ttsDownloadStore.svelte';
import { ttsExecutionStore } from './ttsExecutionStore.svelte';

/**
 * エピソード追加ペイロードのユニオン型
 */
export type EpisodeAddPayload = FileEpisodeAddPayload | YoutubeEpisodeAddPayload;

let show = $state(false);
let isSubmitting = $state(false);
let sourceType = $state('file' as 'file' | 'youtube');

// Reset all form state
function reset() {
  sourceType = 'file';
  isSubmitting = false;
  fileEpisodeAddStore.reset();
  youtubeEpisodeAddStore.reset();
  ttsDownloadStore.reset();
  ttsExecutionStore.reset();
}

export const episodeAddStore = {
  // Modal state getters
  get show() {
    return show && !ttsDownloadStore.showModal && !ttsExecutionStore.showModal;
  },
  get isSubmitting() {
    return isSubmitting;
  },

  // Form type property
  get sourceType() {
    return sourceType;
  },
  set sourceType(type: 'file' | 'youtube') {
    sourceType = type;
  },

  // Modal actions
  open() {
    show = true;
  },

  close() {
    reset();
    show = false;
  },

  startSubmitting() {
    isSubmitting = true;
  },

  // Build payload for submission
  buildPayload(): EpisodeAddPayload | null {
    if (sourceType === 'file') {
      return fileEpisodeAddStore.buildPayload();
    } else if (sourceType === 'youtube') {
      return youtubeEpisodeAddStore.buildPayload();
    }
    return null;
  },

  // Check if TTS is required
  isTtsRequired(): boolean {
    if (sourceType !== 'file') return false;
    return fileEpisodeAddStore.shouldGenerateAudio;
  },

  // Sub-stores
  file: fileEpisodeAddStore,
  youtube: youtubeEpisodeAddStore,
};
