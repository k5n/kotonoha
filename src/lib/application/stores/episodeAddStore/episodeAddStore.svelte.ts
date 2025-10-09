import type { FileEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';

/**
 * エピソード追加ペイロードのユニオン型
 */
export type EpisodeAddPayload = FileEpisodeAddPayload | YoutubeEpisodeAddPayload;

const store = $state({
  // Modal state
  show: false,
  isSubmitting: false,

  // Form type
  sourceType: 'file' as 'file' | 'youtube',
});

// Reset all form state
function reset() {
  store.sourceType = 'file';
  store.isSubmitting = false;
  fileEpisodeAddStore.reset();
  youtubeEpisodeAddStore.reset();
}

export const episodeAddStore = {
  // Modal state getters
  get show() {
    return store.show;
  },
  get isSubmitting() {
    return store.isSubmitting;
  },

  // Form type property
  get sourceType() {
    return store.sourceType;
  },
  set sourceType(type: 'file' | 'youtube') {
    store.sourceType = type;
  },

  // Modal actions
  open() {
    store.show = true;
  },

  close() {
    reset();
    store.show = false;
  },

  startSubmitting() {
    store.isSubmitting = true;
  },

  // Build payload for submission
  buildPayload(): EpisodeAddPayload | null {
    if (store.sourceType === 'file') {
      return fileEpisodeAddStore.buildPayload();
    } else if (store.sourceType === 'youtube') {
      return youtubeEpisodeAddStore.buildPayload();
    }
    return null;
  },

  // Sub-stores
  file: fileEpisodeAddStore,
  youtube: youtubeEpisodeAddStore,
};
