<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
  import type { YoutubeEpisodeAddPayload } from '$lib/presentation/types/episodeAddPayload';
  import { Button, Input, Label, Spinner } from 'flowbite-svelte';

  type Props = {
    youtubeUrl: string;
    youtubeMetadata: YoutubeMetadata | null;
    isYoutubeMetadataFetching: boolean;
    isSubmitting: boolean;
    errorMessage: string;
    onYoutubeUrlChange: (url: string) => void;
    onSubmit: (payload: YoutubeEpisodeAddPayload) => Promise<void>;
    onCancel: () => void;
  };

  let {
    youtubeUrl,
    youtubeMetadata,
    isYoutubeMetadataFetching,
    isSubmitting,
    errorMessage,
    onYoutubeUrlChange,
    onSubmit,
    onCancel,
  }: Props = $props();

  let submitting = $state(false);
  let localErrorMessage = $derived(errorMessage);
  let title = $derived(youtubeMetadata?.title || '');

  async function handleSubmit() {
    if (submitting || isSubmitting || isYoutubeMetadataFetching || !youtubeMetadata) return;
    localErrorMessage = '';
    if (!title.trim()) {
      localErrorMessage = t('components.episodeAddModal.errorTitleRequired');
      return;
    }
    if (!youtubeUrl.trim()) {
      localErrorMessage = t('components.episodeAddModal.errorYoutubeUrlRequired');
      return;
    }

    submitting = true;
    try {
      await onSubmit({
        source: 'youtube',
        youtubeMetadata: { ...youtubeMetadata, title: title.trim() },
        youtubeUrl,
      });
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    localErrorMessage = '';
    onCancel();
  }
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="youtubeUrl"
    >{t('components.episodeAddModal.youtubeUrlLabel')}</Label
  >
  <Input
    id="youtubeUrl"
    placeholder={t('components.episodeAddModal.youtubeUrlPlaceholder')}
    value={youtubeUrl}
    oninput={(e) => onYoutubeUrlChange((e.currentTarget as HTMLInputElement).value)}
    type="url"
  />
</div>

<div class="mb-4">
  <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
  <Input
    id="title"
    disabled={isYoutubeMetadataFetching}
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={title}
    oninput={(e) => {
      title = (e.currentTarget as HTMLInputElement).value;
    }}
    type="text"
  />
</div>

{#if isYoutubeMetadataFetching}
  <div class="mb-4 flex justify-center">
    <Spinner size="16" />
  </div>
{:else if youtubeMetadata}
  <div class="mb-4">
    <iframe
      class="mx-auto h-64 w-128"
      src={youtubeMetadata.embedUrl}
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  </div>
{/if}

{#if localErrorMessage}
  <div class="mb-4">
    <div class="text-sm text-red-600">{localErrorMessage}</div>
  </div>
{/if}

<div class="flex justify-end gap-2">
  <Button
    color="gray"
    disabled={isSubmitting || submitting || isYoutubeMetadataFetching}
    onclick={handleCancel}
  >
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button
    onclick={handleSubmit}
    disabled={isSubmitting || submitting || isYoutubeMetadataFetching || !youtubeMetadata}
  >
    {isSubmitting || submitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
