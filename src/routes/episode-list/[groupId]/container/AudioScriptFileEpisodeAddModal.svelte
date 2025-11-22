<script lang="ts">
  import type { AudioScriptFileEpisodeAddPayload } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { audioScriptFileEpisodeAddStore } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
  import FileSelect from '$lib/presentation/components/presentational/FileSelect.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Heading, Input, Label, Modal, Select } from 'flowbite-svelte';
  import TsvConfigSection from './TsvConfigSection.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: AudioScriptFileEpisodeAddPayload) => Promise<void>;
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

  // Field validation state
  let fieldErrors = $state({
    title: '',
    audioFile: '',
    scriptFile: '',
    learningLanguage: '',
    tsvConfig: '',
  });

  let fieldTouched = $state({
    title: false,
    audioFile: false,
    scriptFile: false,
    learningLanguage: false,
    tsvConfig: false,
  });

  function resetFormState() {
    audioScriptFileEpisodeAddStore.reset();
    // Reset validation state
    fieldErrors = {
      title: '',
      audioFile: '',
      scriptFile: '',
      learningLanguage: '',
      tsvConfig: '',
    };
    fieldTouched = {
      title: false,
      audioFile: false,
      scriptFile: false,
      learningLanguage: false,
      tsvConfig: false,
    };
  }

  // Validation functions
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

  function validateLearningLanguage(): string {
    return audioScriptFileEpisodeAddStore.selectedStudyLanguage
      ? ''
      : t('components.fileEpisodeForm.errorLanguageRequired');
  }

  // Input handlers with real-time validation
  function handleTitleInput(e: Event) {
    audioScriptFileEpisodeAddStore.title = (e.currentTarget as HTMLInputElement).value;
    if (fieldTouched.title) {
      fieldErrors.title = validateTitle();
    }
  }

  function handleTitleBlur() {
    fieldTouched.title = true;
    fieldErrors.title = validateTitle();
  }

  // Effect to validate learning language when it changes
  $effect(() => {
    if (audioScriptFileEpisodeAddStore.selectedStudyLanguage !== null) {
      fieldTouched.learningLanguage = true;
      fieldErrors.learningLanguage = validateLearningLanguage();
    }
  });

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
  }

  // Form validity check
  let isFormValid = $derived(
    audioScriptFileEpisodeAddStore.title.trim() &&
      audioScriptFileEpisodeAddStore.audioFilePath &&
      audioScriptFileEpisodeAddStore.scriptFilePath &&
      audioScriptFileEpisodeAddStore.selectedStudyLanguage &&
      (!tsvConfigStore.scriptPreview || tsvConfigStore.isValid)
  );

  let cancelDisabled = $derived(isSubmitting || tsvConfigStore.isFetchingScriptPreview);

  let submitDisabled = $derived(
    !isFormValid || isSubmitting || tsvConfigStore.isFetchingScriptPreview
  );

  let learningTargetLanguageOptions = $derived(
    audioScriptFileEpisodeAddStore.learningTargetLanguages.map((lang) => ({
      value: lang,
      name: `${t(bcp47ToTranslationKey(lang)!)} (${bcp47ToLanguageName(lang)})`,
    })) || []
  );

  async function handleAudioFileChange(filePath: string | null) {
    audioScriptFileEpisodeAddStore.audioFilePath = filePath;
    fieldTouched.audioFile = true;
    fieldErrors.audioFile = validateAudioFile();
  }

  async function handleScriptFileChange(filePath: string | null) {
    audioScriptFileEpisodeAddStore.scriptFilePath = filePath;

    // Mark as touched and validate
    fieldTouched.audioFile = true;
    fieldErrors.audioFile = validateAudioFile();
    fieldTouched.scriptFile = true;
    fieldErrors.scriptFile = validateScriptFile();

    if (!filePath) {
      tsvConfigStore.reset();
      audioScriptFileEpisodeAddStore.selectedStudyLanguage = null;
      await onDetectScriptLanguage();
      return;
    }

    const normalized = filePath.toLowerCase();
    if (normalized.endsWith('.tsv')) {
      await onTsvFileSelected(filePath);
      // Mark TSV config as touched when TSV file is loaded
      fieldTouched.tsvConfig = true;
    } else {
      tsvConfigStore.reset();
      await onDetectScriptLanguage();
    }
  }

  async function handleSubmit() {
    if (isSubmitting || submitDisabled) {
      return;
    }

    const payload = audioScriptFileEpisodeAddStore.buildPayload();
    if (!payload) {
      audioScriptFileEpisodeAddStore.errorMessage = t(
        'components.fileEpisodeForm.errorSubmissionFailed'
      );
      return;
    }

    try {
      isSubmitting = true;
      await onSubmitRequested(payload);
    } finally {
      handleClose();
    }
  }
</script>

<Modal onclose={handleClose} {open} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">
      {t('components.episodeAddModal.title')}
    </Heading>

    <div class="mb-4">
      <Label class="mb-2 block" for="title">{t('components.fileEpisodeForm.titleLabel')}</Label>
      <Input
        id="title"
        class={fieldTouched.title && !fieldErrors.title ? 'border-green-700' : ''}
        placeholder={t('components.fileEpisodeForm.titlePlaceholder')}
        value={audioScriptFileEpisodeAddStore.title}
        oninput={handleTitleInput}
        onblur={handleTitleBlur}
        type="text"
      />
      {#if fieldTouched.title && fieldErrors.title}
        <div class="mt-1 text-sm text-red-600">{fieldErrors.title}</div>
      {/if}
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="audioFile">
        {t('components.fileEpisodeForm.audioFileLabel')}
      </Label>
      <FileSelect
        color={fieldTouched.audioFile && !fieldErrors.audioFile ? 'green' : 'light'}
        accept="audio/*"
        value={audioScriptFileEpisodeAddStore.audioFilePath}
        onFileSelected={(file) => {
          handleAudioFileChange(file);
        }}
        onClear={() => {
          handleAudioFileChange(null);
        }}
        id="audioFile"
        dataTestId="audio-file-select"
      />
      {#if fieldTouched.audioFile && fieldErrors.audioFile}
        <div class="mt-1 text-sm text-red-600">{fieldErrors.audioFile}</div>
      {/if}
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="scriptFile">
        {t('components.fileEpisodeForm.scriptFileLabel')}
      </Label>
      <FileSelect
        color={fieldTouched.scriptFile && !fieldErrors.scriptFile && !tsvConfigStore.errorMessageKey
          ? 'green'
          : 'light'}
        accept=".srt,.sswt,.tsv,.vtt,.txt"
        value={audioScriptFileEpisodeAddStore.scriptFilePath}
        onFileSelected={(file) => handleScriptFileChange(file)}
        onClear={() => handleScriptFileChange(null)}
        id="scriptFile"
        dataTestId="script-file-select"
      />
      {#if fieldTouched.scriptFile && fieldErrors.scriptFile}
        <div class="mt-1 text-sm text-red-600">{fieldErrors.scriptFile}</div>
      {/if}
    </div>

    {#if tsvConfigStore.scriptPreview}
      <TsvConfigSection {onDetectScriptLanguage} />
      {#if fieldTouched.tsvConfig && fieldErrors.tsvConfig}
        <div class="mb-4 text-sm text-red-600">{fieldErrors.tsvConfig}</div>
      {/if}
    {/if}

    {#if learningTargetLanguageOptions.length > 0}
      <div class="mb-4">
        <Label class="mb-2 block" for="learningLanguage">
          {t('components.fileEpisodeForm.learningLanguageLabel')}
        </Label>
        {#if audioScriptFileEpisodeAddStore.languageDetectionWarningMessage}
          <div class="mb-2 text-sm text-yellow-600">
            {audioScriptFileEpisodeAddStore.languageDetectionWarningMessage}
          </div>
        {/if}
        <Select
          id="learningLanguage"
          data-testid="learningLanguage"
          bind:value={audioScriptFileEpisodeAddStore.selectedStudyLanguage}
          items={learningTargetLanguageOptions}
        ></Select>
        {#if fieldTouched.learningLanguage && fieldErrors.learningLanguage}
          <div class="mt-1 text-sm text-red-600">{fieldErrors.learningLanguage}</div>
        {/if}
      </div>
    {/if}

    {#if audioScriptFileEpisodeAddStore.errorMessage}
      <div class="mb-4">
        <div class="text-sm text-red-600">
          {audioScriptFileEpisodeAddStore.errorMessage}
        </div>
      </div>
    {/if}
    {#if tsvConfigStore.errorMessageKey}
      <div class="mb-4">
        <div class="text-sm text-red-600">
          {t(tsvConfigStore.errorMessageKey)}
        </div>
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" disabled={cancelDisabled} onclick={handleClose}>
        {t('common.cancel')}
      </Button>
      <Button
        data-testid="audio-script-file-episode-add-submit"
        disabled={submitDisabled}
        onclick={handleSubmit}
      >
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
