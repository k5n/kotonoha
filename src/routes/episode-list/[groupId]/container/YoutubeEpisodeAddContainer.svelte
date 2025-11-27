<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { YoutubeEpisodeAddPayload } from '$lib/application/usecases/addNewEpisode';
  import {
    fetchYoutubeMetadata,
    InvalidYoutubeUrlError,
    YoutubeDataApiKeyNotSetError,
  } from '$lib/application/usecases/fetchYoutubeMetadata';
  import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
  import { bcp47ToTranslationKey } from '$lib/utils/language';
  import YoutubeEpisodeAddModal from '../presentational/YoutubeEpisodeAddModal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: YoutubeEpisodeAddPayload) => Promise<void>;
  };
  let { open = false, onClose, onSubmit }: Props = $props();

  let isSubmitting = $state(false);

  let url = $state('');
  let metadata = $state<YoutubeMetadata | null>(null);
  let isMetadataFetching = $state(false);
  let errorMessageKey = $state('');

  const isLanguageSupported = $derived(
    !!metadata && bcp47ToTranslationKey(metadata.language) !== undefined
  );

  const isFormBusy = $derived(isSubmitting || isMetadataFetching);

  const languageName = $derived.by(() => {
    if (!metadata) return '';
    const languageKey = bcp47ToTranslationKey(metadata.language);
    return languageKey
      ? t(languageKey)
      : t('components.youtubeEpisodeForm.errorUnsupportedLanguage', {
          language: metadata.language,
        });
  });

  const title = $derived(metadata?.title || '');
  const canSubmit = $derived(Boolean(metadata));

  function resetFormState() {
    url = '';
    metadata = null;
    isMetadataFetching = false;
    errorMessageKey = '';
  }

  function setUrl(value: string) {
    url = value;
    if (!value.trim()) {
      metadata = null;
      errorMessageKey = '';
    }
  }

  function handleTitleChange(titleValue: string) {
    if (metadata) {
      metadata = {
        ...metadata,
        title: titleValue,
      };
    }
  }

  function validate(): boolean {
    const title = metadata?.title?.trim() || '';
    const currentUrl = url.trim();
    if (!title) {
      errorMessageKey = 'components.youtubeEpisodeForm.errorTitleRequired';
      return false;
    }
    if (!currentUrl) {
      errorMessageKey = 'components.youtubeEpisodeForm.errorYoutubeUrlRequired';
      return false;
    }
    if (!isLanguageSupported) {
      errorMessageKey = 'components.youtubeEpisodeForm.errorUnsupportedLanguage';
      return false;
    }
    return true;
  }

  function buildPayload(): YoutubeEpisodeAddPayload | null {
    if (!url.trim() || !metadata) {
      return null;
    }

    return {
      source: 'youtube',
      metadata,
      url,
    };
  }

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
  }

  async function handleYoutubeUrlChange(urlValue: string) {
    setUrl(urlValue.trim());
    if (url === '') {
      return;
    }

    isMetadataFetching = true;
    errorMessageKey = '';
    try {
      metadata = await fetchYoutubeMetadata(urlValue);
    } catch (error) {
      metadata = null;
      if (error instanceof YoutubeDataApiKeyNotSetError) {
        errorMessageKey = 'components.youtubeEpisodeForm.errorApiKeyNotSet';
      } else if (error instanceof InvalidYoutubeUrlError) {
        errorMessageKey = 'components.youtubeEpisodeForm.errorInvalidUrl';
      } else {
        console.error('Failed to fetch YouTube metadata:', error);
        errorMessageKey = 'components.youtubeEpisodeForm.errorFetchFailed';
      }
    } finally {
      isMetadataFetching = false;
    }
  }

  async function handleSubmitRequest() {
    if (isSubmitting || isMetadataFetching) {
      return;
    }

    if (!validate()) {
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    try {
      isSubmitting = true;
      await onSubmit(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to submit YouTube episode:', error);
      errorMessageKey = 'components.youtubeEpisodeForm.errorSubmissionFailed';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<YoutubeEpisodeAddModal
  {open}
  {url}
  {title}
  {metadata}
  {languageName}
  {isLanguageSupported}
  {isMetadataFetching}
  {isFormBusy}
  {isSubmitting}
  {canSubmit}
  {errorMessageKey}
  onUrlChange={handleYoutubeUrlChange}
  onTitleChange={handleTitleChange}
  onSubmit={handleSubmitRequest}
  onClose={handleClose}
/>
