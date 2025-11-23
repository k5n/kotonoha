<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { TtsEpisodeAddPayload } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import { ttsEpisodeAddStore } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import {
    cancelTtsModelDownload,
    downloadTtsModel,
  } from '$lib/application/usecases/downloadTtsModel';
  import { cancelTtsExecution, executeTts } from '$lib/application/usecases/executeTts';
  import { assertNotNull } from '$lib/utils/assertion';
  import { Modal } from 'flowbite-svelte';
  import TtsEpisodeAddForm from '../presentational/TtsEpisodeAddForm.svelte';
  import TtsExecutionModal from './TtsExecutionModal.svelte';
  import TtsModelDownloadModal from './TtsModelDownloadModal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: TtsEpisodeAddPayload) => Promise<void>;
    onTsvFileSelected: (filePath: string) => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
    onTtsEnabled: () => Promise<void>;
  };

  let {
    open = false,
    onClose,
    onSubmitRequested,
    onTsvFileSelected,
    onDetectScriptLanguage,
    onTtsEnabled,
  }: Props = $props();

  let isSubmitting = $state(false);

  let previousOpen = false;
  let fieldErrors = $state({
    title: '',
    scriptFile: '',
  });
  let fieldTouched = $state({
    title: false,
    scriptFile: false,
  });

  function resetFormState() {
    ttsEpisodeAddStore.reset();
    fieldErrors = {
      title: '',
      scriptFile: '',
    };
    fieldTouched = {
      title: false,
      scriptFile: false,
    };
    isSubmitting = false;
  }

  $effect(() => {
    if (open && !previousOpen) {
      resetFormState();
    }

    if (!open && previousOpen) {
      resetFormState();
    }

    previousOpen = open;
  });

  function handleClose() {
    resetFormState();
    onClose();
  }

  function validateTitle(): string {
    const value = ttsEpisodeAddStore.title.trim();
    return value ? '' : t('components.fileEpisodeForm.errorTitleRequired');
  }

  function validateScriptFile(): string {
    return ttsEpisodeAddStore.scriptFilePath
      ? ''
      : t('components.fileEpisodeForm.errorScriptFileRequired');
  }

  function handleTitleChange(title: string) {
    ttsEpisodeAddStore.title = title;
    if (fieldTouched.title) {
      fieldErrors.title = validateTitle();
    }
  }

  function handleTitleBlur() {
    fieldTouched.title = true;
    fieldErrors.title = validateTitle();
  }

  async function handleScriptFileChange(filePath: string | null) {
    ttsEpisodeAddStore.scriptFilePath = filePath;
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = validateScriptFile();

    if (!filePath) {
      ttsEpisodeAddStore.selectedStudyLanguage = null;
      ttsEpisodeAddStore.tsv.reset();
      return;
    }

    const lowered = filePath.toLowerCase();
    try {
      if (lowered.endsWith('.tsv')) {
        await onTsvFileSelected(filePath);
      } else {
        ttsEpisodeAddStore.tsv.reset();
      }
      await onDetectScriptLanguage();
      await onTtsEnabled();
    } catch (error) {
      console.error('Failed to prepare script file for TTS episode:', error);
      ttsEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorSubmissionFailed');
    }
  }

  async function ensureTtsEpisodePayload(): Promise<TtsEpisodeAddPayload> {
    assertNotNull(ttsEpisodeAddStore.scriptFilePath, 'Script file path is required');

    console.info('TTS audio generation required for the new episode');
    await downloadTtsModel();
    await executeTts(ttsEpisodeAddStore);

    const finalPayload = ttsEpisodeAddStore.buildPayload();
    assertNotNull(finalPayload, 'TTS episode payload is null');
    return finalPayload;
  }

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const payload = await ensureTtsEpisodePayload();
      await onSubmitRequested(payload);
    } catch (error) {
      console.error('Failed to submit TTS episode:', error);
    } finally {
      handleClose();
    }
  }

  let isProcessing = $derived(
    ttsEpisodeAddStore.tsv.isFetchingScriptPreview || ttsEpisodeAddStore.tts.isFetchingVoices
  );

  let startTimeColumnErrorMessage = $derived(
    ttsEpisodeAddStore.tsv.startTimeColumnErrorMessageKey
      ? t(ttsEpisodeAddStore.tsv.startTimeColumnErrorMessageKey)
      : ''
  );

  let textColumnErrorMessage = $derived(
    ttsEpisodeAddStore.tsv.textColumnErrorMessageKey
      ? t(ttsEpisodeAddStore.tsv.textColumnErrorMessageKey)
      : ''
  );
</script>

<Modal onclose={handleClose} {open} size="xl">
  <TtsEpisodeAddForm
    {isSubmitting}
    {isProcessing}
    title={ttsEpisodeAddStore.title}
    scriptFilePath={ttsEpisodeAddStore.scriptFilePath}
    tsvPreviewOpen={!!ttsEpisodeAddStore.tsv.scriptPreview}
    tsvValid={ttsEpisodeAddStore.tsv.isValid}
    tsvConfig={ttsEpisodeAddStore.tsv.tsvConfig}
    tsvPreviewHeaders={ttsEpisodeAddStore.tsv.scriptPreview?.headers || []}
    tsvPreviewRows={ttsEpisodeAddStore.tsv.scriptPreview?.rows || []}
    tsvStartTimeColumnErrorMessage={startTimeColumnErrorMessage}
    tsvTextColumnErrorMessage={textColumnErrorMessage}
    selectedStudyLanguage={ttsEpisodeAddStore.selectedStudyLanguage}
    learningTargetLanguages={ttsEpisodeAddStore.learningTargetLanguages}
    languageDetectionWarningMessage={ttsEpisodeAddStore.languageDetectionWarningMessage}
    {fieldErrors}
    {fieldTouched}
    errorMessage={ttsEpisodeAddStore.errorMessage}
    tsvErrorMessage={t(ttsEpisodeAddStore.tsv.errorMessageKey)}
    onTitleChange={handleTitleChange}
    onTitleBlur={handleTitleBlur}
    onScriptFilePathChange={handleScriptFileChange}
    onCancel={handleClose}
    onSubmit={handleSubmit}
    {onTsvFileSelected}
    {onDetectScriptLanguage}
    onTsvConfigUpdate={(key, value) => ttsEpisodeAddStore.tsv.updateConfig(key, value)}
    {onTtsEnabled}
  />
</Modal>

<TtsModelDownloadModal onCancel={cancelTtsModelDownload} />

<TtsExecutionModal onCancel={cancelTtsExecution} />
