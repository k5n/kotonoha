<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Checkbox, Input, Label, Spinner } from 'flowbite-svelte';

  type Props = {
    onSubmit: () => void;
    onYoutubeUrlChanged: (url: string) => void;
  };
  let { onSubmit, onYoutubeUrlChanged }: Props = $props();

  let isLanguageSupported = $derived(() => {
    const metadata = episodeAddStore.youtubeMetadata;
    return !metadata || bcp47ToTranslationKey(metadata.language) !== undefined;
  });

  let languageName = $derived.by(() => {
    const metadata = episodeAddStore.youtubeMetadata;
    if (!metadata) return '';
    const languageKey = bcp47ToTranslationKey(metadata.language);
    return languageKey
      ? t(languageKey)
      : t('components.episodeAddModal.errorUnsupportedLanguage', {
          language: metadata.language,
        });
  });

  async function handleSubmit() {
    const youtubeMetadata = episodeAddStore.youtubeMetadata;
    const isYoutubeMetadataFetching = episodeAddStore.isYoutubeMetadataFetching;
    const isSubmitting = episodeAddStore.isSubmitting;

    if (isSubmitting || isYoutubeMetadataFetching || !youtubeMetadata) return;

    const errorMessageKey = episodeAddStore.validateYoutubeForm();
    if (errorMessageKey) {
      episodeAddStore.youtubeErrorMessage = t(errorMessageKey);
      return;
    }
    if (!isLanguageSupported()) {
      episodeAddStore.youtubeErrorMessage = t(
        'components.episodeAddModal.errorUnsupportedLanguage',
        {
          language: youtubeMetadata.language,
        }
      );
      return;
    }

    onSubmit();
  }
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="youtubeUrl"
    >{t('components.episodeAddModal.youtubeUrlLabel')}</Label
  >
  <Input
    id="youtubeUrl"
    placeholder={t('components.episodeAddModal.youtubeUrlPlaceholder')}
    value={episodeAddStore.youtubeUrl}
    oninput={(e) => {
      const url = (e.currentTarget as HTMLInputElement).value;
      episodeAddStore.youtubeUrl = url;
      onYoutubeUrlChanged(url);
    }}
    type="url"
  />
</div>

<div class="mb-4">
  <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
  <Input
    id="title"
    disabled={episodeAddStore.isYoutubeMetadataFetching}
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={episodeAddStore.youtubeMetadata?.title || ''}
    oninput={(e) => {
      episodeAddStore.changeYoutubeTitle((e.currentTarget as HTMLInputElement).value);
    }}
    type="text"
  />
</div>

{#if episodeAddStore.isYoutubeMetadataFetching}
  <div class="mb-4 flex justify-center">
    <Spinner size="16" />
  </div>
{:else if episodeAddStore.youtubeMetadata}
  <div class="mb-4">
    <iframe
      class="mx-auto h-64 w-128"
      src={episodeAddStore.youtubeMetadata.embedUrl}
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
        {t('components.episodeAddModal.videoLanguageLabel')}:
      </Label>
      <span class="ml-2 text-sm {isLanguageSupported() ? 'text-gray-700' : 'text-red-600'}">
        {languageName}
      </span>
    </div>

    <!-- ASR checkbox (read-only) -->
    <div>
      <Checkbox checked={episodeAddStore.youtubeMetadata.trackKind === 'asr'} disabled>
        {t('components.episodeAddModal.automaticSubtitlesLabel')}
      </Checkbox>
    </div>
  </div>
{/if}

{#if episodeAddStore.youtubeErrorMessage}
  <div class="mb-4">
    <div class="text-sm text-red-600">
      {episodeAddStore.youtubeErrorMessage}
    </div>
  </div>
{/if}

<div class="flex justify-end gap-2">
  <Button
    color="gray"
    disabled={episodeAddStore.isSubmitting || episodeAddStore.isYoutubeMetadataFetching}
    onclick={episodeAddStore.close}
  >
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button
    onclick={handleSubmit}
    disabled={episodeAddStore.isSubmitting ||
      episodeAddStore.isYoutubeMetadataFetching ||
      !episodeAddStore.youtubeMetadata}
  >
    {episodeAddStore.isSubmitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
