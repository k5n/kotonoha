<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { FileBasedEpisodeAddPayload } from '$lib/application/usecases/addNewEpisode';
  import { fetchTtsVoices } from '$lib/application/usecases/fetchTtsVoices';
  import { assert, assertNotNull } from '$lib/utils/assertion';
  import FileEpisodeModal from '../presentational/FileEpisodeModal.svelte';
  import ScriptFileSelect from '../presentational/ScriptFileSelect.svelte';
  import TsvConfigSection from '../presentational/TsvConfigSection.svelte';
  import TtsConfigSection from '../presentational/TtsConfigSection.svelte';
  import TtsExecutionModal from '../presentational/TtsExecutionModal.svelte';
  import TtsModelDownloadModal from '../presentational/TtsModelDownloadModal.svelte';
  import { createFileBasedEpisodeAddController } from './fileBasedEpisodeAddController.svelte';
  import { createTsvConfigController } from './tsvConfigController.svelte';
  import { createTtsConfigController } from './ttsConfigController.svelte';
  import { createTtsExecutionController } from './ttsExecutionController.svelte';
  import { createTtsModelDownloadController } from './ttsModelDownloadController.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: FileBasedEpisodeAddPayload | null) => Promise<void>;
  };
  let { open = false, onClose, onSubmit }: Props = $props();

  const fileBasedEpisodeAddController = createFileBasedEpisodeAddController();
  const tsvConfigController = createTsvConfigController();
  const ttsConfigController = createTtsConfigController();
  const ttsModelDownloadController = createTtsModelDownloadController();
  const ttsExecutionController = createTtsExecutionController();

  let isSubmitting = $state(false);
  let fieldErrors = $state({
    title: '',
    scriptFile: '',
  });
  let fieldTouched = $state({
    title: false,
    scriptFile: false,
  });

  function resetFormState() {
    fileBasedEpisodeAddController.reset();
    ttsConfigController.reset();
    tsvConfigController.reset();
    ttsModelDownloadController.reset();
    ttsExecutionController.reset();
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

  async function handleScriptFileChange(filePath: string | null) {
    fileBasedEpisodeAddController.scriptFilePath = filePath;
    fileBasedEpisodeAddController.audioFilePath = null; // Clear audio file when script file changes
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = fileBasedEpisodeAddController.validateScriptFile();

    if (!filePath) {
      fileBasedEpisodeAddController.selectedStudyLanguage = null;
      tsvConfigController.reset();
      ttsConfigController.reset();
      return;
    }

    if (filePath.toLowerCase().endsWith('.tsv')) {
      await tsvConfigController.fetchScriptPreview(filePath);
    } else {
      tsvConfigController.reset();
    }

    await fileBasedEpisodeAddController.detectLanguage(tsvConfigController.tsvConfig);
    await prepareTtsVoices();
  }

  function handleLearningLanguageChange(lang: string | null) {
    fileBasedEpisodeAddController.selectedStudyLanguage = lang;
    ttsConfigController.setLanguage(lang);
  }

  async function prepareTtsVoices() {
    if (ttsConfigController.isFetchingVoices) {
      console.warn('TTS voices are already being fetched. Skipping duplicate request.');
      return;
    }
    if (ttsConfigController.allVoices) {
      console.log('TTS voices are already fetched. Skipping.');
      ttsConfigController.setLanguage(fileBasedEpisodeAddController.selectedStudyLanguage);
      return;
    }

    try {
      ttsConfigController.startVoicesFetching();
      const voices = await fetchTtsVoices();
      ttsConfigController.setVoiceData(voices);
      ttsConfigController.setLanguage(fileBasedEpisodeAddController.selectedStudyLanguage);
    } catch (error) {
      console.error('Failed to fetch TTS voices:', error);
      ttsConfigController.setError('components.ttsConfigSection.failedToLoad');
    }
  }

  async function ensureTtsEpisodePayload(): Promise<FileBasedEpisodeAddPayload | null> {
    try {
      assertNotNull(fileBasedEpisodeAddController.scriptFilePath, 'Script file path is required');
      const scriptFilePath = fileBasedEpisodeAddController.scriptFilePath;
      const selectedVoice = ttsConfigController.selectedVoice;
      assertNotNull(selectedVoice, 'No TTS voice selected');
      const selectedSpeakerId = parseInt(ttsConfigController.selectedSpeakerId);

      console.info('TTS audio generation required for the new episode');
      await ttsModelDownloadController.start(selectedVoice.files);
      const { audioPath, scriptPath } = await ttsExecutionController.start(
        scriptFilePath,
        selectedVoice,
        selectedSpeakerId,
        tsvConfigController.tsvConfig
      );
      fileBasedEpisodeAddController.scriptFilePath = scriptPath;
      fileBasedEpisodeAddController.audioFilePath = audioPath;

      assert(
        tsvConfigController.scriptPreview === null || tsvConfigController.isValid,
        'TSV config is invalid'
      );
      const finalTsvConfig = tsvConfigController.finalTsvConfig;

      const finalPayload = fileBasedEpisodeAddController.buildPayload(finalTsvConfig);
      assertNotNull(finalPayload, 'TTS episode payload is null');
      return finalPayload;
    } catch (error) {
      console.error('Failed to build TTS episode payload:', error);
      return null;
    }
  }

  async function handleSubmit() {
    isSubmitting = true;
    const payload = await ensureTtsEpisodePayload();
    if (payload !== null) {
      await onSubmit(payload);
      handleClose();
    }
  }

  let isProcessing = $derived(
    tsvConfigController.isFetchingScriptPreview || ttsConfigController.isFetchingVoices
  );

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

  const selectedLanguageVoices = $derived(
    ttsConfigController.learningTargetVoices?.filter(
      (voice) => voice.language.family === ttsConfigController.language
    ) || []
  );

  let isFormValid = $derived(
    fileBasedEpisodeAddController.title.trim().length > 0 &&
      fileBasedEpisodeAddController.scriptFilePath !== null &&
      fileBasedEpisodeAddController.selectedStudyLanguage !== null &&
      tsvConfigController.errorMessageKey === null &&
      (tsvConfigController.scriptPreview === null || tsvConfigController.isValid)
  );
</script>

<FileEpisodeModal
  {open}
  {isSubmitting}
  {isProcessing}
  {isFormValid}
  title={fileBasedEpisodeAddController.title}
  learningLanguage={fileBasedEpisodeAddController.selectedStudyLanguage}
  learningTargetLanguages={fileBasedEpisodeAddController.learningTargetLanguages}
  languageDetectionWarningMessage={fileBasedEpisodeAddController.languageDetectionWarningMessage}
  fieldErrors={{ title: fieldErrors.title }}
  fieldTouched={{ title: fieldTouched.title }}
  errorMessage={fileBasedEpisodeAddController.errorMessage}
  onTitleChange={handleTitleChange}
  onTitleBlur={handleTitleBlur}
  onLearningLanguageChange={handleLearningLanguageChange}
  onClose={handleClose}
  onCancel={handleClose}
  onSubmit={handleSubmit}
>
  <ScriptFileSelect
    scriptFilePath={fileBasedEpisodeAddController.scriptFilePath}
    fieldErrors={{ scriptFile: fieldErrors.scriptFile }}
    fieldTouched={{ scriptFile: fieldTouched.scriptFile }}
    hasOtherErrorRelatedToScriptFile={Boolean(tsvConfigController.errorMessageKey)}
    onScriptFilePathChange={handleScriptFileChange}
  />

  {#if tsvConfigController.scriptPreview}
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

  {#if fileBasedEpisodeAddController.scriptFilePath}
    <TtsConfigSection
      {selectedLanguageVoices}
      selectedQuality={ttsConfigController.selectedQuality}
      selectedVoice={ttsConfigController.selectedVoice}
      selectedSpeakerId={ttsConfigController.selectedSpeakerId}
      isFetchingVoices={ttsConfigController.isFetchingVoices}
      errorMessage={ttsConfigController.errorMessage}
      onSelectedQualityChange={(quality) => (ttsConfigController.selectedQuality = quality)}
      onSelectedVoiceChange={(voiceName) => (ttsConfigController.selectedVoiceName = voiceName)}
      onSelectedSpeakerIdChange={(speakerId) => (ttsConfigController.selectedSpeakerId = speakerId)}
    />
  {/if}
</FileEpisodeModal>

<TtsModelDownloadModal
  open={ttsModelDownloadController.open}
  progress={ttsModelDownloadController.progress}
  isDownloading={ttsModelDownloadController.isDownloading}
  errorMessage={t(ttsModelDownloadController.errorMessageKey)}
  onCancel={ttsModelDownloadController.cancel}
  onClose={ttsModelDownloadController.close}
/>

<TtsExecutionModal
  open={ttsExecutionController.open}
  progress={ttsExecutionController.progress}
  contextLines={ttsExecutionController.contextLines}
  isExecuting={ttsExecutionController.isExecuting}
  errorMessage={t(ttsExecutionController.errorMessageKey)}
  onCancel={ttsExecutionController.cancel}
  onClose={ttsExecutionController.close}
/>
