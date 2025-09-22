<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileEpisodeForm from '$lib/presentation/components/FileEpisodeForm.svelte';
  import YoutubeEpisodeForm from '$lib/presentation/components/YoutubeEpisodeForm.svelte';
  import type { TsvConfig } from '$lib/presentation/utils/episodeFormValidator';
  import { Heading, Label, Modal, Radio } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting: boolean;
    youtubeTitle: string;
    onClose: () => void;
    onSubmit: (
      _title: string,
      _audioFilePath: string,
      _scriptFilePath: string,
      _tsvConfig?: TsvConfig
    ) => void;
    onYoutubeUrlChange?: (url: string) => void;
  };
  let {
    show,
    isSubmitting,
    youtubeTitle = $bindable(''),
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
    youtubeTitle = '';
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
          // adapt payload to parent's positional onSubmit
          await onSubmit(
            payload.title,
            payload.audioFilePath,
            payload.scriptFilePath,
            payload.tsvConfig
          );
        }}
        onCancel={handleClose}
      />
    {/if}

    {#if sourceType === 'youtube'}
      <YoutubeEpisodeForm
        title={youtubeTitle}
        {youtubeUrl}
        {isSubmitting}
        onTitleChange={(newTitle) => (youtubeTitle = newTitle)}
        onYoutubeUrlChange={(url) => {
          youtubeUrl = url;
          onYoutubeUrlChange?.(url);
        }}
        onSubmit={async (payload) => {
          // adapt payload to parent's positional onSubmit; use youtubeUrl path (parent expects audio/script args)
          // For YouTube we call parent onSubmit with youtube URL as audioFilePath and empty script path.
          await onSubmit(payload.title, payload.youtubeUrl, '', undefined);
        }}
        onCancel={handleClose}
      />
    {/if}
  </div>
</Modal>
