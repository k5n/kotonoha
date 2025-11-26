<script lang="ts">
  import type { FileBasedEpisodeAddPayload } from '$lib/application/stores/FileBasedEpisodeAddStore.svelte';
  import { fileBasedEpisodeAddStore } from '$lib/application/stores/FileBasedEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
  import { ttsConfigStore } from '$lib/application/stores/ttsConfigStore.svelte';
  import { ttsDownloadStore } from '$lib/application/stores/ttsDownloadStore.svelte';
  import {
    cancelTtsModelDownload,
    createDownloadTasks,
    downloadTtsModel,
  } from '$lib/application/usecases/downloadTtsModel';
  import { cancelTtsExecution, executeTts } from '$lib/application/usecases/executeTts';
  import { fetchTtsVoices } from '$lib/application/usecases/fetchTtsVoices';
  import type { FileInfo } from '$lib/domain/entities/voice';
  import { assert, assertNotNull } from '$lib/utils/assertion';
  import { Modal } from 'flowbite-svelte';
  import FileEpisodeForm from '../presentational/FileEpisodeForm.svelte';
  import ScriptFileSelect from '../presentational/ScriptFileSelect.svelte';
  import TsvConfigSection from '../presentational/TsvConfigSection.svelte';
  import TtsConfigSection from '../presentational/TtsConfigSection.svelte';
  import TtsExecutionModal from './TtsExecutionModal.svelte';
  import TtsModelDownloadModal from './TtsModelDownloadModal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: FileBasedEpisodeAddPayload | null) => Promise<void>;
    onTsvFileSelected: (filePath: string) => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
  };

  let {
    open = false,
    onClose,
    onSubmitRequested,
    onTsvFileSelected,
    onDetectScriptLanguage,
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
    fileBasedEpisodeAddStore.reset();
    ttsConfigStore.reset();
    tsvConfigStore.reset();
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
    const value = fileBasedEpisodeAddStore.title.trim();
    return value ? '' : t('components.fileEpisodeForm.errorTitleRequired');
  }

  function validateScriptFile(): string {
    return fileBasedEpisodeAddStore.scriptFilePath
      ? ''
      : t('components.fileEpisodeForm.errorScriptFileRequired');
  }

  function handleTitleChange(title: string) {
    fileBasedEpisodeAddStore.title = title;
    if (fieldTouched.title) {
      fieldErrors.title = validateTitle();
    }
  }

  function handleTitleBlur() {
    fieldTouched.title = true;
    fieldErrors.title = validateTitle();
  }

  async function handleScriptFileChange(filePath: string | null) {
    fileBasedEpisodeAddStore.scriptFilePath = filePath;
    fileBasedEpisodeAddStore.audioFilePath = null; // Clear audio file when script file changes
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = validateScriptFile();

    if (!filePath) {
      fileBasedEpisodeAddStore.selectedStudyLanguage = null;
      tsvConfigStore.reset();
      return;
    }

    const lowered = filePath.toLowerCase();
    try {
      if (lowered.endsWith('.tsv')) {
        await onTsvFileSelected(filePath);
      } else {
        tsvConfigStore.reset();
      }
      await onDetectScriptLanguage();
      await prepareTtsVoices();
    } catch (error) {
      console.error('Failed to prepare script file for TTS episode:', error);
      fileBasedEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorSubmissionFailed');
    }
  }

  async function prepareTtsVoices() {
    if (ttsConfigStore.isFetchingVoices) {
      console.warn('TTS voices are already being fetched. Skipping duplicate request.');
      return;
    }
    if (ttsConfigStore.allVoices) {
      console.log('TTS voices are already fetched. Skipping.');
      ttsConfigStore.setLanguage(fileBasedEpisodeAddStore.selectedStudyLanguage);
      return;
    }

    try {
      ttsConfigStore.startVoicesFetching();
      const voices = await fetchTtsVoices();
      ttsConfigStore.setVoiceData(voices);
      ttsConfigStore.setLanguage(fileBasedEpisodeAddStore.selectedStudyLanguage);
    } catch (error) {
      console.error('Failed to fetch TTS voices:', error);
      ttsConfigStore.setError('components.ttsConfigSection.failedToLoad');
    }
  }

  async function ensureTtsEpisodePayload(): Promise<FileBasedEpisodeAddPayload | null> {
    try {
      assertNotNull(fileBasedEpisodeAddStore.scriptFilePath, 'Script file path is required');

      console.info('TTS audio generation required for the new episode');
      await startDownloadTtsModel();
      await executeTts(fileBasedEpisodeAddStore);

      assert(
        tsvConfigStore.scriptPreview === null || tsvConfigStore.isValid,
        'TSV config is invalid'
      );
      const finalTsvConfig = tsvConfigStore.finalTsvConfig;

      const finalPayload = fileBasedEpisodeAddStore.buildPayload(finalTsvConfig);
      assertNotNull(finalPayload, 'TTS episode payload is null');
      return finalPayload;
    } catch (error) {
      console.error('Failed to build TTS episode payload:', error);
      throw null;
    }
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
    tsvConfigStore.isFetchingScriptPreview || ttsConfigStore.isFetchingVoices
  );

  let startTimeColumnErrorMessage = $derived(
    tsvConfigStore.startTimeColumnErrorMessageKey
      ? t(tsvConfigStore.startTimeColumnErrorMessageKey)
      : ''
  );

  let textColumnErrorMessage = $derived(
    tsvConfigStore.textColumnErrorMessageKey ? t(tsvConfigStore.textColumnErrorMessageKey) : ''
  );

  const selectedLanguageVoices = $derived(
    ttsConfigStore.learningTargetVoices?.filter(
      (voice) => voice.language.family === ttsConfigStore.language
    ) || []
  );

  const selectedQuality = $derived(ttsConfigStore.selectedQuality);
  const selectedVoice = $derived(ttsConfigStore.selectedVoice);
  const selectedSpeakerId = $derived(ttsConfigStore.selectedSpeakerId);
  const isFetchingTtsVoices = $derived(ttsConfigStore.isFetchingVoices);
  const ttsErrorMessage = $derived(ttsConfigStore.errorMessage);

  function handleSelectedQualityChange(quality: string) {
    ttsConfigStore.selectedQuality = quality;
  }

  function handleSelectedVoiceChange(voiceName: string) {
    ttsConfigStore.selectedVoiceName = voiceName;
  }

  function handleSelectedSpeakerIdChange(speakerId: string) {
    ttsConfigStore.selectedSpeakerId = speakerId;
  }

  let isFormValid = $derived(
    fileBasedEpisodeAddStore.title.trim().length > 0 &&
      fileBasedEpisodeAddStore.scriptFilePath !== null &&
      fileBasedEpisodeAddStore.selectedStudyLanguage !== null &&
      (!tsvConfigStore.scriptPreview || tsvConfigStore.isValid)
  );

  // TTS model download

  let downloadTasks: readonly FileInfo[] = $state([]);
  const ttsDownloadModalOpen = $derived(ttsDownloadStore.showModal);
  const ttsDownloadProgress = $derived(ttsDownloadStore.progress);
  const ttsDownloadIsDownloading = $derived(ttsDownloadStore.isDownloading);
  const ttsDownloadErrorMessageKey = $derived(ttsDownloadStore.errorMessageKey);

  async function startDownloadTtsModel(): Promise<void> {
    try {
      assertNotNull(ttsConfigStore.selectedVoice, 'No TTS voice selected');
      downloadTasks = await createDownloadTasks(ttsConfigStore.selectedVoice.files);
      if (downloadTasks.length === 0) {
        console.log('All TTS model files are already downloaded.');
        return;
      }
      ttsDownloadStore.openModal();
      await downloadTtsModel(downloadTasks, ttsDownloadStore.updateProgress);
      ttsDownloadStore.closeModal();
    } catch (error) {
      console.error('Failed to download TTS model:', error);
      ttsDownloadStore.failedDownload('components.ttsModelDownloadModal.error.downloadFailed');
    }
  }

  async function handleTtsModelDownloadCancel() {
    try {
      const downloadIds = downloadTasks.map((file) => file.path);
      await cancelTtsModelDownload(downloadIds);
    } finally {
      ttsDownloadStore.closeModal();
    }
  }
</script>

<Modal onclose={handleClose} {open} size="xl">
  <FileEpisodeForm
    {isSubmitting}
    {isProcessing}
    {isFormValid}
    title={fileBasedEpisodeAddStore.title}
    selectedStudyLanguage={fileBasedEpisodeAddStore.selectedStudyLanguage}
    learningTargetLanguages={fileBasedEpisodeAddStore.learningTargetLanguages}
    languageDetectionWarningMessage={fileBasedEpisodeAddStore.languageDetectionWarningMessage}
    fieldErrors={{ title: fieldErrors.title }}
    fieldTouched={{ title: fieldTouched.title }}
    errorMessage={fileBasedEpisodeAddStore.errorMessage}
    onTitleChange={handleTitleChange}
    onTitleBlur={handleTitleBlur}
    onCancel={handleClose}
    onSubmit={handleSubmit}
  >
    <ScriptFileSelect
      scriptFilePath={fileBasedEpisodeAddStore.scriptFilePath}
      fieldErrors={{ scriptFile: fieldErrors.scriptFile }}
      fieldTouched={{ scriptFile: fieldTouched.scriptFile }}
      hasOtherErrorRelatedToScriptFile={tsvConfigStore.errorMessageKey !== null}
      onScriptFilePathChange={handleScriptFileChange}
    />

    {#if tsvConfigStore.scriptPreview}
      <TsvConfigSection
        headers={tsvConfigStore.scriptPreview?.headers || []}
        rows={tsvConfigStore.scriptPreview?.rows || []}
        config={tsvConfigStore.tsvConfig}
        valid={tsvConfigStore.isValid}
        {startTimeColumnErrorMessage}
        {textColumnErrorMessage}
        onConfigUpdate={(key, value) => tsvConfigStore.updateConfig(key, value)}
        {onDetectScriptLanguage}
      />
    {/if}

    {#if tsvConfigStore.errorMessageKey}
      <div class="mb-4 text-sm text-red-600">
        {t(tsvConfigStore.errorMessageKey)}
      </div>
    {/if}

    {#if fileBasedEpisodeAddStore.scriptFilePath}
      <TtsConfigSection
        {selectedLanguageVoices}
        {selectedQuality}
        {selectedVoice}
        {selectedSpeakerId}
        isFetchingVoices={isFetchingTtsVoices}
        errorMessage={ttsErrorMessage}
        onSelectedQualityChange={handleSelectedQualityChange}
        onSelectedVoiceChange={handleSelectedVoiceChange}
        onSelectedSpeakerIdChange={handleSelectedSpeakerIdChange}
      />
    {/if}
  </FileEpisodeForm>
</Modal>

<TtsModelDownloadModal
  open={ttsDownloadModalOpen}
  progress={ttsDownloadProgress}
  isDownloading={ttsDownloadIsDownloading}
  errorMessageKey={ttsDownloadErrorMessageKey}
  onCancel={handleTtsModelDownloadCancel}
  onClose={ttsDownloadStore.closeModal}
/>

<TtsExecutionModal onCancel={cancelTtsExecution} />
