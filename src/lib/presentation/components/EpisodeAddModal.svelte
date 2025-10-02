<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
  import FileEpisodeForm from '$lib/presentation/components/FileEpisodeForm.svelte';
  import YoutubeEpisodeForm from '$lib/presentation/components/YoutubeEpisodeForm.svelte';
  import type { EpisodeAddPayload } from '$lib/presentation/types/episodeAddPayload';
  import { Heading, Label, Modal, Radio } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting: boolean;
    youtubeMetadata: YoutubeMetadata | null;
    isYoutubeMetadataFetching: boolean;
    youtubeErrorMessage: string;
    onClose: () => void;
    onSubmit: (payload: EpisodeAddPayload) => void;
    onYoutubeUrlChange?: (url: string) => void;
  };
  let {
    show,
    isSubmitting,
    youtubeMetadata,
    isYoutubeMetadataFetching,
    youtubeErrorMessage,
    onClose,
    onSubmit,
    onYoutubeUrlChange,
  }: Props = $props();

  let audioFilePath = $state<string | null>(null);
  let scriptFilePath = $state<string | null>(null);
  let fileEpisodeTitle = $state('');
  let sourceType = $state('file');
  let youtubeUrl = $state('');

  let tsvConfig = $state({
    startTimeColumnIndex: -1,
    textColumnIndex: -1,
    endTimeColumnIndex: -1,
  });

  function resetForm() {
    audioFilePath = null;
    scriptFilePath = null;
    tsvConfig = {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    };
    sourceType = 'file';
    youtubeUrl = '';
    fileEpisodeTitle = '';
  }

  function handleClose() {
    resetForm();
    onClose();
  }
</script>

<Modal onclose={handleClose} open={show} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>

    <div class="mb-4 flex items-center gap-6">
      <span class="text-sm font-medium text-gray-900 dark:text-white"
        >{t('components.episodeAddModal.sourceTypeLabel')}</span
      >
      <div class="flex items-center">
        <Radio id="source-file" bind:group={sourceType} value="file" />
        <Label for="source-file" class="ms-2"
          >{t('components.episodeAddModal.sourceTypeFile')}</Label
        >
      </div>
      <div class="flex items-center">
        <Radio id="source-youtube" bind:group={sourceType} value="youtube" />
        <Label for="source-youtube" class="ms-2"
          >{t('components.episodeAddModal.sourceTypeYoutube')}</Label
        >
      </div>
    </div>

    {#if sourceType === 'file'}
      <FileEpisodeForm
        title={fileEpisodeTitle}
        {audioFilePath}
        {scriptFilePath}
        {tsvConfig}
        {isSubmitting}
        onTitleChange={(newTitle) => (fileEpisodeTitle = newTitle)}
        onAudioFileChange={(path) => (audioFilePath = path)}
        onScriptFileChange={(path) => (scriptFilePath = path)}
        onTsvConfigChange={(config) => (tsvConfig = config)}
        onSubmit={async (payload) => {
          await onSubmit(payload);
        }}
        onCancel={handleClose}
      />
    {/if}

    {#if sourceType === 'youtube'}
      <YoutubeEpisodeForm
        {youtubeUrl}
        {youtubeMetadata}
        {isYoutubeMetadataFetching}
        {isSubmitting}
        errorMessage={youtubeErrorMessage}
        onYoutubeUrlChange={(url) => {
          youtubeUrl = url;
          onYoutubeUrlChange?.(url);
        }}
        onSubmit={async (payload) => {
          await onSubmit(payload);
        }}
        onCancel={handleClose}
      />
    {/if}
  </div>
</Modal>
