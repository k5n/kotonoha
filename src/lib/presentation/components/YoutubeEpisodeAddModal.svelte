<script lang="ts">
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
  import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Checkbox, Heading, Input, Label, Modal, Spinner } from 'flowbite-svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: YoutubeEpisodeAddPayload) => Promise<void>;
    onYoutubeUrlChanged: (url: string) => Promise<void>;
  };

  let { open = false, onClose, onSubmitRequested, onYoutubeUrlChanged }: Props = $props();

  let isSubmitting = $state(false);
  let previousOpen = false;

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

  function resetFormState() {
    youtubeEpisodeAddStore.reset();
  }

  $effect(() => {
    if (open && !previousOpen) {
      resetFormState();
      isSubmitting = false;
    }

    if (!open && previousOpen) {
      resetFormState();
      isSubmitting = false;
    }

    previousOpen = open;
  });

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
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
      await onSubmitRequested(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to submit YouTube episode:', error);
      youtubeEpisodeAddStore.setErrorMessage('components.youtubeEpisodeForm.errorSubmissionFailed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal {open} onclose={handleClose} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>

    <div class="mb-4">
      <Label class="mb-2 block" for="youtubeUrl"
        >{t('components.youtubeEpisodeForm.youtubeUrlLabel')}</Label
      >
      <Input
        id="youtubeUrl"
        placeholder={t('components.youtubeEpisodeForm.youtubeUrlPlaceholder')}
        value={youtubeEpisodeAddStore.url}
        oninput={(e) => {
          const url = (e.currentTarget as HTMLInputElement).value;
          youtubeEpisodeAddStore.url = url;
          onYoutubeUrlChanged(url);
        }}
        type="url"
      />
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="title">{t('components.youtubeEpisodeForm.titleLabel')}</Label>
      <Input
        id="title"
        disabled={youtubeEpisodeAddStore.isMetadataFetching}
        placeholder={t('components.youtubeEpisodeForm.titlePlaceholder')}
        value={youtubeEpisodeAddStore.metadata?.title || ''}
        oninput={(e) => {
          youtubeEpisodeAddStore.changeTitle((e.currentTarget as HTMLInputElement).value);
        }}
        type="text"
      />
    </div>

    {#if youtubeEpisodeAddStore.isMetadataFetching}
      <div class="mb-4 flex justify-center">
        <Spinner size="16" />
      </div>
    {:else if youtubeEpisodeAddStore.metadata}
      <div class="mb-4">
        <iframe
          class="mx-auto h-64 w-128"
          src={youtubeEpisodeAddStore.metadata.embedUrl}
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>

      <!-- Video metadata section -->
      <div class="mb-4 space-y-3 rounded border border-gray-300 bg-gray-50 p-3">
        <!-- Language display -->
        <div>
          <Label class="inline text-sm font-medium">
            {t('components.youtubeEpisodeForm.videoLanguageLabel')}:
          </Label>
          <span
            class="ml-2 text-sm {youtubeEpisodeAddStore.isLanguageSupported
              ? 'text-gray-700'
              : 'text-red-600'}"
          >
            {languageName}
          </span>
        </div>

        <!-- ASR checkbox (read-only) -->
        <div>
          <Checkbox checked={youtubeEpisodeAddStore.metadata.trackKind === 'asr'} disabled>
            {t('components.youtubeEpisodeForm.automaticSubtitlesLabel')}
          </Checkbox>
        </div>
      </div>
    {/if}

    {#if youtubeEpisodeAddStore.errorMessageKey}
      <div class="mb-4">
        <div class="text-sm text-red-600">
          {t(youtubeEpisodeAddStore.errorMessageKey)}
        </div>
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" disabled={isFormBusy} onclick={handleClose}>
        {t('common.cancel')}
      </Button>
      <Button
        onclick={handleSubmitRequest}
        disabled={isFormBusy || !youtubeEpisodeAddStore.metadata}
      >
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
