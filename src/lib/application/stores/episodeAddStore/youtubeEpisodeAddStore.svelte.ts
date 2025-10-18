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
let errorMessageKey = $state('');

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
      errorMessageKey = '';
    }
  },

  get metadata() {
    return metadata;
  },

  get isMetadataFetching() {
    return isFetching;
  },

  get errorMessageKey() {
    return errorMessageKey;
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
    errorMessageKey = '';
  },

  completeMetadataFetching(newMetadata: YoutubeMetadata | null) {
    metadata = newMetadata;
    isFetching = false;
  },

  failedMetadataFetching(key: string) {
    errorMessageKey = key;
    metadata = null;
    isFetching = false;
  },

  validate(): boolean {
    const title = metadata?.title?.trim() || '';
    const currentUrl = url.trim();
    if (!title) {
      errorMessageKey = 'components.episodeAddModal.errorTitleRequired';
      return false;
    }
    if (!currentUrl) {
      errorMessageKey = 'components.episodeAddModal.errorYoutubeUrlRequired';
      return false;
    }
    if (!isLanguageSupported) {
      errorMessageKey = 'components.episodeAddModal.errorUnsupportedLanguage';
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
    errorMessageKey = '';
  },
};
