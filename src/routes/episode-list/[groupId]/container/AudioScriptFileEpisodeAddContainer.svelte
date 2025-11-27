<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { FileBasedEpisodeAddPayload } from '$lib/application/usecases/addNewEpisode';
  import { assert } from '$lib/utils/assertion';
  import AudioFileSelect from '../presentational/AudioFileSelect.svelte';
  import FileEpisodeModal from '../presentational/FileEpisodeModal.svelte';
  import ScriptFileSelect from '../presentational/ScriptFileSelect.svelte';
  import TsvConfigSection from '../presentational/TsvConfigSection.svelte';
  import { createFileBasedEpisodeAddController } from './fileBasedEpisodeAddController.svelte';
  import { createTsvConfigController } from './tsvConfigController.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: FileBasedEpisodeAddPayload | null) => Promise<void>;
  };
  let { open = false, onClose, onSubmit }: Props = $props();

  const fileBasedEpisodeAddController = createFileBasedEpisodeAddController();
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
    fileBasedEpisodeAddController.reset();
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
    isSubmitting = false;
  }

  function handleTitleChange(title: string) {
    fileBasedEpisodeAddController.title = title;
    if (fieldTouched.title) {
      fieldErrors.title = fileBasedEpisodeAddController.validateTitle();
    }
  }

  function handleTitleBlur() {
    fieldTouched.title = true;
    fieldErrors.title = fileBasedEpisodeAddController.validateTitle();
  }

  function handleClose() {
    resetFormState();
    onClose();
  }

  async function handleAudioFileChange(filePath: string | null) {
    fileBasedEpisodeAddController.audioFilePath = filePath;
    fieldTouched.audioFile = true;
    fieldErrors.audioFile = fileBasedEpisodeAddController.validateAudioFile();
  }

  async function handleScriptFileChange(filePath: string | null) {
    fileBasedEpisodeAddController.scriptFilePath = filePath;

    fieldTouched.audioFile = true;
    fieldErrors.audioFile = fileBasedEpisodeAddController.validateAudioFile();
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = fileBasedEpisodeAddController.validateScriptFile();

    if (!filePath) {
      tsvConfigController.reset();
      fileBasedEpisodeAddController.selectedStudyLanguage = null;
      return;
    }

    if (filePath.toLowerCase().endsWith('.tsv')) {
      await tsvConfigController.fetchScriptPreview(filePath);
    } else {
      tsvConfigController.reset();
    }

    await fileBasedEpisodeAddController.detectLanguage(tsvConfigController.tsvConfig);
  }

  function buildPayload(): FileBasedEpisodeAddPayload | null {
    try {
      assert(
        tsvConfigController.scriptPreview === null || tsvConfigController.isValid,
        'TSV config is invalid'
      );
      const finalTsvConfig = tsvConfigController.finalTsvConfig;
      const payload = fileBasedEpisodeAddController.buildPayload(finalTsvConfig);
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

  let startTimeColumnErrorMessage = $derived(
    tsvConfigController.startTimeColumnErrorMessageKey
      ? t(tsvConfigController.startTimeColumnErrorMessageKey)
      : ''
  );

  let textColumnErrorMessage = $derived(
    tsvConfigController.textColumnErrorMessageKey
      ? t(tsvConfigController.textColumnErrorMessageKey)
      : ''
  );

  let isFormValid = $derived(
    fileBasedEpisodeAddController.title.trim().length > 0 &&
      fileBasedEpisodeAddController.audioFilePath !== null &&
      fileBasedEpisodeAddController.scriptFilePath !== null &&
      fileBasedEpisodeAddController.selectedStudyLanguage !== null &&
      tsvConfigController.errorMessageKey === null &&
      (tsvConfigController.scriptPreview === null || tsvConfigController.isValid)
  );
</script>

<FileEpisodeModal
  {open}
  {isSubmitting}
  isProcessing={tsvConfigController.isFetchingScriptPreview}
  {isFormValid}
  title={fileBasedEpisodeAddController.title}
  learningLanguage={fileBasedEpisodeAddController.selectedStudyLanguage}
  learningTargetLanguages={fileBasedEpisodeAddController.learningTargetLanguages}
  {fieldErrors}
  {fieldTouched}
  languageDetectionWarningMessage={fileBasedEpisodeAddController.languageDetectionWarningMessage}
  errorMessage={fileBasedEpisodeAddController.errorMessage}
  onTitleChange={handleTitleChange}
  onTitleBlur={handleTitleBlur}
  onLearningLanguageChange={(lang) => {
    fileBasedEpisodeAddController.selectedStudyLanguage = lang;
  }}
  onClose={handleClose}
  onCancel={handleClose}
  onSubmit={handleSubmit}
>
  <AudioFileSelect
    audioFilePath={fileBasedEpisodeAddController.audioFilePath}
    {fieldErrors}
    {fieldTouched}
    onAudioFileChange={handleAudioFileChange}
  />
  <ScriptFileSelect
    scriptFilePath={fileBasedEpisodeAddController.scriptFilePath}
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
      {startTimeColumnErrorMessage}
      {textColumnErrorMessage}
      onConfigUpdate={tsvConfigController.updateConfig}
      onDetectScriptLanguage={() =>
        fileBasedEpisodeAddController.detectLanguage(tsvConfigController.tsvConfig)}
    />
  {/if}
  {#if tsvConfigController.errorMessageKey}
    <div class="mb-4 text-sm text-red-600">
      {t(tsvConfigController.errorMessageKey)}
    </div>
  {/if}
</FileEpisodeModal>
