<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
  import { Button, Checkbox, Heading, Input, Label, Modal, Spinner } from 'flowbite-svelte';

  type Props = {
    open: boolean;
    url: string;
    title: string;
    metadata: YoutubeMetadata | null;
    languageName: string;
    isLanguageSupported: boolean;
    isMetadataFetching: boolean;
    isFormBusy: boolean;
    isSubmitting: boolean;
    canSubmit: boolean;
    errorMessageKey: string;
    onClose: () => void;
    onUrlChange: (url: string) => void;
    onTitleChange: (title: string) => void;
    onSubmit: () => void;
  };

  let {
    open = false,
    url,
    title,
    metadata,
    languageName,
    isLanguageSupported,
    isMetadataFetching,
    isFormBusy,
    isSubmitting,
    canSubmit,
    errorMessageKey,
    onClose,
    onUrlChange,
    onTitleChange,
    onSubmit,
  }: Props = $props();
</script>

<Modal {open} onclose={onClose} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>

    <div class="mb-4">
      <Label class="mb-2 block" for="youtubeUrl"
        >{t('components.youtubeEpisodeForm.youtubeUrlLabel')}</Label
      >
      <Input
        id="youtubeUrl"
        placeholder={t('components.youtubeEpisodeForm.youtubeUrlPlaceholder')}
        value={url}
        oninput={(e) => {
          onUrlChange((e.currentTarget as HTMLInputElement).value);
        }}
        type="url"
      />
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="title">{t('components.youtubeEpisodeForm.titleLabel')}</Label>
      <Input
        id="title"
        disabled={isMetadataFetching}
        placeholder={t('components.youtubeEpisodeForm.titlePlaceholder')}
        value={title}
        oninput={(e) => {
          onTitleChange((e.currentTarget as HTMLInputElement).value);
        }}
        type="text"
      />
    </div>

    {#if isMetadataFetching}
      <div class="mb-4 flex justify-center">
        <Spinner size="16" />
      </div>
    {:else if metadata}
      <div class="mb-4">
        <iframe
          class="mx-auto h-64 w-128"
          src={metadata.embedUrl}
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>

      <div class="mb-4 space-y-3 rounded border border-gray-300 bg-gray-50 p-3">
        <div>
          <Label class="inline text-sm font-medium">
            {t('components.youtubeEpisodeForm.videoLanguageLabel')}:
          </Label>
          <span class="ml-2 text-sm {isLanguageSupported ? 'text-gray-700' : 'text-red-600'}">
            {languageName}
          </span>
        </div>

        <div>
          <Checkbox checked={metadata.trackKind === 'asr'} disabled>
            {t('components.youtubeEpisodeForm.automaticSubtitlesLabel')}
          </Checkbox>
        </div>
      </div>
    {/if}

    {#if errorMessageKey}
      <div class="mb-4">
        <div class="text-sm text-red-600">
          {t(errorMessageKey)}
        </div>
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" disabled={isFormBusy} onclick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button onclick={onSubmit} disabled={isFormBusy || !canSubmit}>
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
