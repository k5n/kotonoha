<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
  import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Checkbox, Input, Label, Spinner } from 'flowbite-svelte';

  type Props = {
    onSubmit: () => Promise<void>;
    onYoutubeUrlChanged: (url: string) => Promise<void>;
  };
  let { onSubmit, onYoutubeUrlChanged }: Props = $props();

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

  async function handleSubmit() {
    if (
      episodeAddStore.isSubmitting ||
      youtubeEpisodeAddStore.isMetadataFetching ||
      !youtubeEpisodeAddStore.metadata
    ) {
      return;
    }

    if (youtubeEpisodeAddStore.validate()) {
      onSubmit();
    }
  }
</script>

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
  <Button
    color="gray"
    disabled={episodeAddStore.isSubmitting || youtubeEpisodeAddStore.isMetadataFetching}
    onclick={episodeAddStore.close}
  >
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button
    onclick={handleSubmit}
    disabled={episodeAddStore.isSubmitting ||
      youtubeEpisodeAddStore.isMetadataFetching ||
      !youtubeEpisodeAddStore.metadata}
  >
    {episodeAddStore.isSubmitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
