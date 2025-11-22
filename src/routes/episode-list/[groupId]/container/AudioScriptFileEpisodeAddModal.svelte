<script lang="ts">
  import type { AudioScriptFileEpisodeAddPayload } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { audioScriptFileEpisodeAddStore } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
  import { Modal } from 'flowbite-svelte';
  import AudioScriptFileEpisodeForm from '../presentational/AudioScriptFileEpisodeForm.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: AudioScriptFileEpisodeAddPayload | null) => Promise<void>;
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
    audioScriptFileEpisodeAddStore.reset();
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
    const value = audioScriptFileEpisodeAddStore.title.trim();
    return value ? '' : t('components.fileEpisodeForm.errorTitleRequired');
  }

  function validateAudioFile(): string {
    return audioScriptFileEpisodeAddStore.audioFilePath
      ? ''
      : t('components.fileEpisodeForm.errorAudioRequired');
  }

  function validateScriptFile(): string {
    return audioScriptFileEpisodeAddStore.scriptFilePath
      ? ''
      : t('components.fileEpisodeForm.errorScriptFileRequired');
  }

  function handleTitleChange(title: string) {
    audioScriptFileEpisodeAddStore.title = title;
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
    audioScriptFileEpisodeAddStore.audioFilePath = filePath;
    fieldTouched.audioFile = true;
    fieldErrors.audioFile = validateAudioFile();
  }

  async function handleScriptFileChange(filePath: string | null) {
    audioScriptFileEpisodeAddStore.scriptFilePath = filePath;

    fieldTouched.audioFile = true;
    fieldErrors.audioFile = validateAudioFile();
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = validateScriptFile();

    if (!filePath) {
      tsvConfigStore.reset();
      audioScriptFileEpisodeAddStore.selectedStudyLanguage = null;
      return;
    }

    const normalized = filePath.toLowerCase();
    if (normalized.endsWith('.tsv')) {
      await onTsvFileSelected(filePath);
    } else {
      tsvConfigStore.reset();
      await onDetectScriptLanguage();
    }
  }

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const payload = audioScriptFileEpisodeAddStore.buildPayload();
      await onSubmitRequested(payload);
    } finally {
      handleClose();
    }
  }
</script>

<Modal onclose={handleClose} {open} size="xl">
  <AudioScriptFileEpisodeForm
    {isSubmitting}
    isProcessing={tsvConfigStore.isFetchingScriptPreview}
    title={audioScriptFileEpisodeAddStore.title}
    audioFilePath={audioScriptFileEpisodeAddStore.audioFilePath}
    scriptFilePath={audioScriptFileEpisodeAddStore.scriptFilePath}
    openTsvConfigSection={!!tsvConfigStore.scriptPreview}
    validTsv={tsvConfigStore.isValid}
    selectedStudyLanguage={audioScriptFileEpisodeAddStore.selectedStudyLanguage}
    learningTargetLanguages={audioScriptFileEpisodeAddStore.learningTargetLanguages}
    languageDetectionWarningMessage={audioScriptFileEpisodeAddStore.languageDetectionWarningMessage}
    {fieldErrors}
    {fieldTouched}
    errorMessage={audioScriptFileEpisodeAddStore.errorMessage}
    tsvErrorMessage={t(tsvConfigStore.errorMessageKey)}
    onTitleChange={handleTitleChange}
    onTitleBlur={handleTitleBlur}
    onAudioFileChange={handleAudioFileChange}
    onScriptFilePathChange={handleScriptFileChange}
    onCancel={handleClose}
    onSubmit={handleSubmit}
    {onTsvFileSelected}
    {onDetectScriptLanguage}
  />
</Modal>
