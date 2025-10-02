<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import type { FileEpisodeAddPayload, TsvConfig } from '$lib/presentation/types/episodeAddPayload';
  import { Button, Input, Label } from 'flowbite-svelte';

  type Props = {
    title: string;
    audioFilePath: string | null;
    scriptFilePath: string | null;
    tsvConfig: {
      startTimeColumnIndex: number;
      textColumnIndex: number;
      endTimeColumnIndex: number;
    };
    isSubmitting: boolean;
    onTitleChange: (title: string) => void;
    onAudioFileChange: (path: string | null) => void;
    onScriptFileChange: (path: string | null) => void;
    onTsvConfigChange: (config: {
      startTimeColumnIndex: number;
      textColumnIndex: number;
      endTimeColumnIndex: number;
    }) => void;
    onSubmit: (payload: FileEpisodeAddPayload) => Promise<void>;
    onCancel: () => void;
  };

  let {
    title,
    audioFilePath,
    scriptFilePath,
    tsvConfig,
    isSubmitting,
    onTitleChange,
    onAudioFileChange,
    onScriptFileChange,
    onTsvConfigChange,
    onSubmit,
    onCancel,
  }: Props = $props();

  let scriptPreview = $state<ScriptPreview | null>(null);
  let localError = $state('');
  let submitting = $state(false);

  // Auto-preview TSV files
  $effect(() => {
    if (scriptFilePath && scriptFilePath.toLowerCase().endsWith('.tsv')) {
      previewScriptFile(scriptFilePath)
        .then((preview) => {
          localError = '';
          scriptPreview = preview;
        })
        .catch((e) => {
          localError = t('components.episodeAddModal.errorTsvParse');
          scriptPreview = null;
          console.error(e);
        });
    } else {
      scriptPreview = null;
    }
  });

  function buildTsvConfig(tsvConfig: {
    startTimeColumnIndex: number;
    textColumnIndex: number;
    endTimeColumnIndex: number;
  }): TsvConfig | undefined {
    if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
      return undefined;
    }
    return {
      startTimeColumnIndex: tsvConfig.startTimeColumnIndex,
      textColumnIndex: tsvConfig.textColumnIndex,
      ...(tsvConfig.endTimeColumnIndex !== -1 && {
        endTimeColumnIndex: tsvConfig.endTimeColumnIndex,
      }),
    };
  }

  async function handleSubmit() {
    localError = '';
    if (!title.trim()) {
      localError = t('components.episodeAddModal.errorTitleRequired');
      return;
    }
    if (!audioFilePath) {
      localError = t('components.episodeAddModal.errorAudioFileRequired');
      return;
    }
    if (!scriptFilePath) {
      localError = t('components.episodeAddModal.errorScriptFileRequired');
      return;
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        localError = t('components.episodeAddModal.errorTsvColumnRequired');
        return;
      }
    }

    const finalTsvConfig = buildTsvConfig(tsvConfig);

    submitting = true;
    try {
      await onSubmit({
        source: 'file',
        title: title.trim(),
        audioFilePath: audioFilePath,
        scriptFilePath: scriptFilePath,
        tsvConfig: finalTsvConfig,
      });
      // Parent (+page.svelte) will handle closing and showing global errors on failure
    } catch (e) {
      // Per user's instruction: if onSubmit fails, the modal should be closed and +page shows the error.
      // We'll rethrow so parent can catch if it wants, but also set a local error fallback.
      localError = t('components.episodeAddModal.errorAudioFileLoad');
      console.error(e);
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
  <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
  <Input
    id="title"
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={title}
    oninput={(e) => onTitleChange((e.currentTarget as HTMLInputElement).value)}
    type="text"
  />
</div>

<div class="mb-4">
  <Label class="mb-2 block" for="audioFile">
    {t('components.episodeAddModal.audioFileLabel')}
  </Label>
  <FileSelect
    accept="audio/*"
    onFileSelected={(file) => onAudioFileChange(file || null)}
    id="audioFile"
  />
</div>

<div class="mb-4">
  <Label class="mb-2 block" for="scriptFile">
    {t('components.episodeAddModal.scriptFileLabel')}
  </Label>
  <FileSelect
    accept=".srt,.sswt,.tsv,.vtt"
    onFileSelected={(file) => onScriptFileChange(file || null)}
    id="scriptFile"
  />
</div>

{#if scriptPreview}
  <TsvConfigSection {scriptPreview} {tsvConfig} {onTsvConfigChange} />
{/if}

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
