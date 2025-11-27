<script lang="ts">
  import {
    fileBasedEpisodeAddStore,
    type FileBasedEpisodeAddPayload,
  } from '$lib/application/stores/FileBasedEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import { assert } from '$lib/utils/assertion';
  import AudioFileSelect from '../presentational/AudioFileSelect.svelte';
  import FileEpisodeModal from '../presentational/FileEpisodeModal.svelte';
  import ScriptFileSelect from '../presentational/ScriptFileSelect.svelte';
  import TsvConfigSection from '../presentational/TsvConfigSection.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: FileBasedEpisodeAddPayload | null) => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
  };

  let { open = false, onClose, onSubmit, onDetectScriptLanguage }: Props = $props();

  let isSubmitting = $state(false);

  let fieldErrors = $state({
    title: '',
    audioFile: '',
    scriptFile: '',
  });

  let fieldTouched = $state({
    title: false,
    audioFile: false,
    scriptFile: false,
  });

  function resetFormState() {
    fileBasedEpisodeAddStore.reset();
    tsvConfigStore.reset();
    fieldErrors = {
      title: '',
      audioFile: '',
      scriptFile: '',
    };
    fieldTouched = {
      title: false,
      audioFile: false,
      scriptFile: false,
    };
  }

  function validateTitle(): string {
    const value = fileBasedEpisodeAddStore.title.trim();
    return value ? '' : t('components.fileEpisodeForm.errorTitleRequired');
  }

  function validateAudioFile(): string {
    return fileBasedEpisodeAddStore.audioFilePath
      ? ''
      : t('components.fileEpisodeForm.errorAudioRequired');
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

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
  }

  async function handleAudioFileChange(filePath: string | null) {
    fileBasedEpisodeAddStore.audioFilePath = filePath;
    fieldTouched.audioFile = true;
    fieldErrors.audioFile = validateAudioFile();
  }

  async function handleScriptFileChange(filePath: string | null) {
    fileBasedEpisodeAddStore.scriptFilePath = filePath;

    fieldTouched.audioFile = true;
    fieldErrors.audioFile = validateAudioFile();
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = validateScriptFile();

    if (!filePath) {
      tsvConfigStore.reset();
      fileBasedEpisodeAddStore.selectedStudyLanguage = null;
      return;
    }

    const normalized = filePath.toLowerCase();
    if (normalized.endsWith('.tsv')) {
      await previewScriptFile(filePath);
    } else {
      tsvConfigStore.reset();
      await onDetectScriptLanguage();
    }
  }

  function buildPayload(): FileBasedEpisodeAddPayload | null {
    try {
      assert(
        tsvConfigStore.scriptPreview === null || tsvConfigStore.isValid,
        'TSV config is invalid'
      );
      const finalTsvConfig = tsvConfigStore.finalTsvConfig;
      const payload = fileBasedEpisodeAddStore.buildPayload(finalTsvConfig);
      return payload;
    } catch (e) {
      console.error(`Failed to build payload: ${e}`);
      return null;
    }
  }

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const payload = buildPayload();
      await onSubmit(payload);
    } finally {
      handleClose();
    }
  }
</script>

<FileEpisodeModal
  {open}
  {isSubmitting}
  isProcessing={tsvConfigStore.isFetchingScriptPreview}
  isFormValid={fileBasedEpisodeAddStore.title.trim().length > 0 &&
    fileBasedEpisodeAddStore.audioFilePath !== null &&
    fileBasedEpisodeAddStore.scriptFilePath !== null &&
    fileBasedEpisodeAddStore.selectedStudyLanguage !== null &&
    (tsvConfigStore.scriptPreview === null || tsvConfigStore.isValid)}
  title={fileBasedEpisodeAddStore.title}
  selectedStudyLanguage={fileBasedEpisodeAddStore.selectedStudyLanguage}
  learningTargetLanguages={fileBasedEpisodeAddStore.learningTargetLanguages}
  {fieldErrors}
  {fieldTouched}
  languageDetectionWarningMessage={fileBasedEpisodeAddStore.languageDetectionWarningMessage}
  errorMessage={fileBasedEpisodeAddStore.errorMessage}
  onTitleChange={handleTitleChange}
  onTitleBlur={handleTitleBlur}
  onClose={handleClose}
  onCancel={handleClose}
  onSubmit={handleSubmit}
>
  <AudioFileSelect
    audioFilePath={fileBasedEpisodeAddStore.audioFilePath}
    {fieldErrors}
    {fieldTouched}
    onAudioFileChange={handleAudioFileChange}
  />
  <ScriptFileSelect
    scriptFilePath={fileBasedEpisodeAddStore.scriptFilePath}
    {fieldErrors}
    {fieldTouched}
    hasOtherErrorRelatedToScriptFile={tsvConfigStore.errorMessageKey !== null}
    onScriptFilePathChange={handleScriptFileChange}
  />
  {#if tsvConfigStore.scriptPreview !== null}
    <TsvConfigSection
      headers={tsvConfigStore.scriptPreview?.headers || []}
      rows={tsvConfigStore.scriptPreview?.rows || []}
      config={tsvConfigStore.tsvConfig}
      valid={tsvConfigStore.isValid}
      startTimeColumnErrorMessage={tsvConfigStore.startTimeColumnErrorMessageKey
        ? t(tsvConfigStore.startTimeColumnErrorMessageKey)
        : ''}
      textColumnErrorMessage={tsvConfigStore.textColumnErrorMessageKey
        ? t(tsvConfigStore.textColumnErrorMessageKey)
        : ''}
      onConfigUpdate={(key, value) => tsvConfigStore.updateConfig(key, value)}
      {onDetectScriptLanguage}
    />
  {/if}
  {#if tsvConfigStore.errorMessageKey}
    <div class="mb-4 text-sm text-red-600">
      {t(tsvConfigStore.errorMessageKey)}
    </div>
  {/if}
</FileEpisodeModal>
