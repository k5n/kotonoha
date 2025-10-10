import { t } from '$lib/application/stores/i18n.svelte';
import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { bcp47ToTranslationKey } from '$lib/utils/language';

/**
 * YouTubeベースのエピソード追加ペイロード
 */
export type YoutubeEpisodeAddPayload = {
  readonly source: 'youtube';
  readonly metadata: YoutubeMetadata;
  readonly url: string;
};

let url = $state('');
let metadata = $state<YoutubeMetadata | null>(null);
let isFetching = $state(false);
let errorMessage = $state('');

const isLanguageSupported = $derived(
  metadata && bcp47ToTranslationKey(metadata.language) !== undefined
);

export const youtubeEpisodeAddStore = {
  get url() {
    return url;
  },
  set url(value: string) {
    url = value;
    // Clear metadata and error when URL changes
    if (!value.trim()) {
      metadata = null;
      errorMessage = '';
    }
  },

  get metadata() {
    return metadata;
  },

  get isMetadataFetching() {
    return isFetching;
  },

  get errorMessage() {
    return errorMessage;
  },

  get isLanguageSupported() {
    return isLanguageSupported;
  },

  changeTitle(title: string) {
    if (metadata) {
      metadata = {
        ...metadata,
        title: title,
      };
    }
  },

  startMetadataFetching() {
    isFetching = true;
    errorMessage = '';
  },

  completeMetadataFetching(newMetadata: YoutubeMetadata | null) {
    metadata = newMetadata;
    isFetching = false;
  },

  failedMetadataFetching(message: string) {
    errorMessage = message;
    metadata = null;
    isFetching = false;
  },

  validate(): boolean {
    const title = metadata?.title?.trim() || '';
    const currentUrl = url.trim();
    if (!title) {
      errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return false;
    }
    if (!currentUrl) {
      errorMessage = t('components.episodeAddModal.errorYoutubeUrlRequired');
      return false;
    }
    if (!isLanguageSupported) {
      errorMessage = t('components.episodeAddModal.errorUnsupportedLanguage', {
        language: metadata?.language || '',
      });
      return false;
    }
    return true;
  },

  buildPayload(): YoutubeEpisodeAddPayload | null {
    if (!url.trim() || !metadata) {
      return null;
    }

    return {
      source: 'youtube',
      metadata: metadata,
      url: url,
    };
  },

  reset() {
    url = '';
    metadata = null;
    isFetching = false;
    errorMessage = '';
  },
};
