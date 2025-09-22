<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { validateYoutubeEpisodeForm } from '$lib/presentation/utils/episodeFormValidator';
  import { Button, Input, Label } from 'flowbite-svelte';

  type Props = {
    title: string;
    youtubeUrl: string;
    isSubmitting: boolean;
    onTitleChange: (title: string) => void;
    onYoutubeUrlChange: (url: string) => void;
    onSubmit: (payload: { source: 'youtube'; title: string; youtubeUrl: string }) => Promise<void>;
    onCancel: () => void;
  };

  let {
    title,
    youtubeUrl,
    isSubmitting,
    onTitleChange,
    onYoutubeUrlChange,
    onSubmit,
    onCancel,
  }: Props = $props();

  let localError = $state('');
  let submitting = $state(false);

  async function handleSubmit() {
    localError = '';
    const validationError = validateYoutubeEpisodeForm({ title, youtubeUrl });
    if (validationError) {
      localError = validationError;
      return;
    }

    submitting = true;
    try {
      await onSubmit({ source: 'youtube', title, youtubeUrl });
    } catch (e) {
      // Per user's instruction: close modal on onSubmit failure and let +page show error.
      console.error(e);
      throw e;
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    localError = '';
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
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={title}
    oninput={(e) => onTitleChange((e.currentTarget as HTMLInputElement).value)}
    type="text"
  />
</div>

{#if localError}
  <div class="mb-4">
    <div class="text-sm text-red-600">{localError}</div>
  </div>
{/if}

<div class="flex justify-end gap-2">
  <Button color="gray" disabled={isSubmitting || submitting} onclick={handleCancel}>
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button onclick={handleSubmit} disabled={isSubmitting || submitting}>
    {isSubmitting || submitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
