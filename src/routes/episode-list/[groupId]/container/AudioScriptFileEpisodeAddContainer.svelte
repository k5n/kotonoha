<script lang="ts">
  import { fileBasedEpisodeAddStore } from '$lib/application/stores/fileBasedEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { FileBasedEpisodeAddPayload } from '$lib/application/usecases/addNewEpisode';
  import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
  import { assert } from '$lib/utils/assertion';
  import AudioFileSelect from '../presentational/AudioFileSelect.svelte';
  import FileEpisodeModal from '../presentational/FileEpisodeModal.svelte';
  import ScriptFileSelect from '../presentational/ScriptFileSelect.svelte';
  import TsvConfigSection from '../presentational/TsvConfigSection.svelte';
  import { createTsvConfigController } from './tsvConfigController.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: FileBasedEpisodeAddPayload | null) => Promise<void>;
    onDetectScriptLanguage: (tsvConfig: TsvConfig) => Promise<void>;
  };
  let { open = false, onClose, onSubmit, onDetectScriptLanguage }: Props = $props();

  const tsvConfigController = createTsvConfigController();

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
    tsvConfigController.reset();
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
      tsvConfigController.reset();
      fileBasedEpisodeAddStore.selectedStudyLanguage = null;
      return;
    }

    const normalized = filePath.toLowerCase();
    if (normalized.endsWith('.tsv')) {
      await tsvConfigController.fetchScriptPreview(filePath);
    } else {
      tsvConfigController.reset();
      await onDetectScriptLanguage(tsvConfigController.tsvConfig);
    }
  }

  function buildPayload(): FileBasedEpisodeAddPayload | null {
    try {
      assert(
        tsvConfigController.scriptPreview === null || tsvConfigController.isValid,
        'TSV config is invalid'
      );
      const finalTsvConfig = tsvConfigController.finalTsvConfig;
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
  isProcessing={tsvConfigController.isFetchingScriptPreview}
  isFormValid={fileBasedEpisodeAddStore.title.trim().length > 0 &&
    fileBasedEpisodeAddStore.audioFilePath !== null &&
    fileBasedEpisodeAddStore.scriptFilePath !== null &&
    fileBasedEpisodeAddStore.selectedStudyLanguage !== null &&
    (tsvConfigController.scriptPreview === null || tsvConfigController.isValid)}
  title={fileBasedEpisodeAddStore.title}
  learningLanguage={fileBasedEpisodeAddStore.selectedStudyLanguage}
  learningTargetLanguages={fileBasedEpisodeAddStore.learningTargetLanguages}
  {fieldErrors}
  {fieldTouched}
  languageDetectionWarningMessage={fileBasedEpisodeAddStore.languageDetectionWarningMessage}
  errorMessage={fileBasedEpisodeAddStore.errorMessage}
  onTitleChange={handleTitleChange}
  onTitleBlur={handleTitleBlur}
  onLearningLanguageChange={(lang) => {
    fileBasedEpisodeAddStore.selectedStudyLanguage = lang;
  }}
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
    hasOtherErrorRelatedToScriptFile={Boolean(tsvConfigController.errorMessageKey)}
    onScriptFilePathChange={handleScriptFileChange}
  />
  {#if tsvConfigController.scriptPreview !== null}
    <TsvConfigSection
      headers={tsvConfigController.scriptPreview?.headers || []}
      rows={tsvConfigController.scriptPreview?.rows || []}
      config={tsvConfigController.tsvConfig}
      valid={tsvConfigController.isValid}
      startTimeColumnErrorMessage={tsvConfigController.startTimeColumnErrorMessageKey
        ? t(tsvConfigController.startTimeColumnErrorMessageKey)
        : ''}
      textColumnErrorMessage={tsvConfigController.textColumnErrorMessageKey
        ? t(tsvConfigController.textColumnErrorMessageKey)
        : ''}
      onConfigUpdate={(key, value) => tsvConfigController.updateConfig(key, value)}
      onDetectScriptLanguage={() => onDetectScriptLanguage(tsvConfigController.tsvConfig)}
    />
  {/if}
  {#if tsvConfigController.errorMessageKey}
    <div class="mb-4 text-sm text-red-600">
      {t(tsvConfigController.errorMessageKey)}
    </div>
  {/if}
</FileEpisodeModal>
