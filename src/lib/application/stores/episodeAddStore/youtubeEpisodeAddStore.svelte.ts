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

const store = $state({
  url: '',
  metadata: null as YoutubeMetadata | null,
  isFetching: false,
  errorMessage: '',
});

function isLanguageSupported() {
  const metadata = store.metadata;
  return metadata && bcp47ToTranslationKey(metadata.language) !== undefined;
}

export const youtubeEpisodeAddStore = {
  get url() {
    return store.url;
  },
  set url(url: string) {
    store.url = url;
    // Clear metadata and error when URL changes
    if (!url.trim()) {
      store.metadata = null;
      store.errorMessage = '';
    }
  },

  get metadata() {
    return store.metadata;
  },

  get isMetadataFetching() {
    return store.isFetching;
  },

  get errorMessage() {
    return store.errorMessage;
  },

  get isLanguageSupported() {
    return isLanguageSupported();
  },

  changeTitle(title: string) {
    if (store.metadata) {
      store.metadata = {
        ...store.metadata,
        title: title,
      };
    }
  },

  startMetadataFetching() {
    store.isFetching = true;
    store.errorMessage = '';
  },

  completeMetadataFetching(metadata: YoutubeMetadata | null) {
    store.metadata = metadata;
    store.isFetching = false;
  },

  failedMetadataFetching(errorMessage: string) {
    store.errorMessage = errorMessage;
    store.metadata = null;
    store.isFetching = false;
  },

  validate(): boolean {
    const title = store.metadata?.title?.trim() || '';
    const url = store.url.trim();
    if (!title) {
      store.errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return false;
    }
    if (!url) {
      store.errorMessage = t('components.episodeAddModal.errorYoutubeUrlRequired');
      return false;
    }
    if (!isLanguageSupported()) {
      store.errorMessage = t('components.episodeAddModal.errorUnsupportedLanguage', {
        language: store.metadata?.language || '',
      });
      return false;
    }
    return true;
  },

  buildPayload(): YoutubeEpisodeAddPayload | null {
    if (!store.url.trim() || !store.metadata) {
      return null;
    }

    return {
      source: 'youtube',
      metadata: store.metadata,
      url: store.url,
    };
  },

  reset() {
    store.url = '';
    store.metadata = null;
    store.isFetching = false;
    store.errorMessage = '';
  },
};
