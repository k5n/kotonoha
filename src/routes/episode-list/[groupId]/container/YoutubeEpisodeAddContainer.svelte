<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { youtubeEpisodeAddStore } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
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

  let isFormBusy = $derived(isSubmitting || youtubeEpisodeAddStore.isMetadataFetching);

  let languageName = $derived.by(() => {
    const metadata = youtubeEpisodeAddStore.metadata;
    if (!metadata) return '';
    const languageKey = bcp47ToTranslationKey(metadata.language);
    return languageKey
      ? t(languageKey)
      : t('components.youtubeEpisodeForm.errorUnsupportedLanguage', {
          language: metadata.language,
        });
  });

  const metadata = $derived<YoutubeMetadata | null>(youtubeEpisodeAddStore.metadata);
  const url = $derived(youtubeEpisodeAddStore.url);
  const title = $derived(youtubeEpisodeAddStore.metadata?.title || '');
  const canSubmit = $derived(Boolean(youtubeEpisodeAddStore.metadata));
  const isLanguageSupported = $derived(Boolean(youtubeEpisodeAddStore.isLanguageSupported));

  function resetFormState() {
    youtubeEpisodeAddStore.reset();
  }

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
  }

  async function handleYoutubeUrlChange(urlValue: string) {
    youtubeEpisodeAddStore.url = urlValue.trim();
    if (youtubeEpisodeAddStore.url === '') {
      return;
    }

    youtubeEpisodeAddStore.startMetadataFetching();
    try {
      const metadata = await fetchYoutubeMetadata(urlValue);
      youtubeEpisodeAddStore.completeMetadataFetching(metadata);
    } catch (error) {
      if (error instanceof YoutubeDataApiKeyNotSetError) {
        youtubeEpisodeAddStore.failedMetadataFetching(
          'components.youtubeEpisodeForm.errorApiKeyNotSet'
        );
      } else if (error instanceof InvalidYoutubeUrlError) {
        youtubeEpisodeAddStore.failedMetadataFetching(
          'components.youtubeEpisodeForm.errorInvalidUrl'
        );
      } else {
        console.error('Failed to fetch YouTube metadata:', error);
        youtubeEpisodeAddStore.failedMetadataFetching(
          'components.youtubeEpisodeForm.errorFetchFailed'
        );
      }
    }
  }

  function handleTitleChange(titleValue: string) {
    youtubeEpisodeAddStore.changeTitle(titleValue);
  }

  async function handleSubmitRequest() {
    if (isSubmitting || youtubeEpisodeAddStore.isMetadataFetching) {
      return;
    }

    if (!youtubeEpisodeAddStore.validate()) {
      return;
    }

    const payload = youtubeEpisodeAddStore.buildPayload();
    if (!payload) {
      return;
    }

    try {
      isSubmitting = true;
      await onSubmit(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to submit YouTube episode:', error);
      youtubeEpisodeAddStore.setErrorMessage('components.youtubeEpisodeForm.errorSubmissionFailed');
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
  isMetadataFetching={youtubeEpisodeAddStore.isMetadataFetching}
  {isFormBusy}
  {isSubmitting}
  {canSubmit}
  errorMessageKey={youtubeEpisodeAddStore.errorMessageKey}
  onUrlChange={handleYoutubeUrlChange}
  onTitleChange={handleTitleChange}
  onSubmit={handleSubmitRequest}
  onClose={handleClose}
/>
