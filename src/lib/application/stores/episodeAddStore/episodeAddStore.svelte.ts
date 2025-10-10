import type { FileEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';

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
}

export const episodeAddStore = {
  // Modal state getters
  get show() {
    return show;
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

  // Sub-stores
  file: fileEpisodeAddStore,
  youtube: youtubeEpisodeAddStore,
};
