<script lang="ts">
  import type { FileEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
  import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import TtsConfigSection from '$lib/presentation/components/TtsConfigSection.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Checkbox, Heading, Input, Label, Modal, Select } from 'flowbite-svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: FileEpisodeAddPayload) => Promise<void>;
    onTsvFileSelected: (filePath: string) => Promise<void>;
    onTtsEnabled: () => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
  };

  let {
    open = false,
    onClose,
    onSubmitRequested,
    onTsvFileSelected,
    onTtsEnabled,
    onDetectScriptLanguage,
  }: Props = $props();

  let isSubmitting = $state(false);
  let previousOpen = false;

  function resetFormState() {
    fileEpisodeAddStore.reset();
  }

  $effect(() => {
    if (open && !previousOpen) {
      resetFormState();
      isSubmitting = false;
    }

    if (!open && previousOpen) {
      resetFormState();
      isSubmitting = false;
    }

    previousOpen = open;
  });

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
  }

  let disabled = $derived(
    isSubmitting ||
      fileEpisodeAddStore.tsv.isFetchingScriptPreview ||
      fileEpisodeAddStore.tts.isFetchingVoices
  );

  let isTxtScriptFile = $derived(
    fileEpisodeAddStore.scriptFilePath?.toLowerCase().endsWith('.txt') ?? false
  );
  let extension = $derived(
    fileEpisodeAddStore.scriptFilePath?.split('.').pop()?.toLowerCase() ?? null
  );
  let hasOnlyScriptFile = $derived(
    !!fileEpisodeAddStore.scriptFilePath && !fileEpisodeAddStore.audioFilePath
  );
  let shouldShowTtsSection = $derived(
    hasOnlyScriptFile &&
      (extension !== 'tsv' || fileEpisodeAddStore.tsv.tsvConfig.textColumnIndex >= 0)
  );
  let learningTargetLanguageOptions = $derived(
    fileEpisodeAddStore.learningTargetLanguages.map((lang) => ({
      value: lang,
      name: `${t(bcp47ToTranslationKey(lang)!)} (${bcp47ToLanguageName(lang)})`,
    })) || []
  );

  async function handleScriptFileChange(filePath: string | null) {
    fileEpisodeAddStore.scriptFilePath = filePath;
    if (filePath && filePath.toLowerCase().endsWith('.tsv')) {
      await handleTtsCheckboxChange(false);
      await onTsvFileSelected(filePath);
    } else if (filePath && filePath.toLowerCase().endsWith('.txt')) {
      await handleTtsCheckboxChange(true);
    } else {
      await handleTtsCheckboxChange(false);
      await onDetectScriptLanguage();
    }
  }

  async function handleTtsCheckboxChange(checked: boolean) {
    fileEpisodeAddStore.shouldGenerateAudio = checked;
    if (checked) {
      await onTtsEnabled();
    }
  }

  function validateLocal(): boolean {
    const titleValue = (fileEpisodeAddStore.title || '').trim();
    const audioFilePathValue = fileEpisodeAddStore.audioFilePath;
    const scriptFilePathValue = fileEpisodeAddStore.scriptFilePath;
    const scriptPreview = fileEpisodeAddStore.tsv.scriptPreview;
    const tsvConfig = fileEpisodeAddStore.tsv.tsvConfig;

    if (!titleValue) {
      fileEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorTitleRequired');
      return false;
    }
    if (!audioFilePathValue && !fileEpisodeAddStore.shouldGenerateAudio) {
      fileEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorAudioRequired');
      return false;
    }
    if (!scriptFilePathValue) {
      fileEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorScriptFileRequired');
      return false;
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        fileEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorTsvColumnRequired');
        return false;
      }
    }

    fileEpisodeAddStore.errorMessage = '';
    return true;
  }

  async function handleSubmit() {
    if (isSubmitting || !validateLocal()) {
      return;
    }

    const payload = fileEpisodeAddStore.buildPayload();
    if (!payload) {
      return;
    }

    try {
      isSubmitting = true;
      await onSubmitRequested(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to submit file episode:', error);
      fileEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorSubmissionFailed');
    } finally {
      isSubmitting = false;
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
        placeholder={t('components.fileEpisodeForm.titlePlaceholder')}
        value={fileEpisodeAddStore.title}
        oninput={(e) => (fileEpisodeAddStore.title = (e.currentTarget as HTMLInputElement).value)}
        type="text"
      />
    </div>

    {#if !fileEpisodeAddStore.shouldGenerateAudio}
      <div class="mb-4">
        <Label class="mb-2 block" for="audioFile">
          {t('components.fileEpisodeForm.audioFileLabel')}
        </Label>
        <FileSelect
          accept="audio/*"
          value={fileEpisodeAddStore.audioFilePath}
          onFileSelected={(file) => {
            fileEpisodeAddStore.audioFilePath = file;
          }}
          onClear={() => {
            fileEpisodeAddStore.audioFilePath = null;
          }}
          id="audioFile"
        />
      </div>
    {/if}

    <div class="mb-4">
      <Label class="mb-2 block" for="scriptFile">
        {t('components.fileEpisodeForm.scriptFileLabel')}
      </Label>
      <FileSelect
        accept=".srt,.sswt,.tsv,.vtt,.txt"
        value={fileEpisodeAddStore.scriptFilePath}
        onFileSelected={(file) => handleScriptFileChange(file)}
        onClear={() => handleScriptFileChange(null)}
        id="scriptFile"
      />
    </div>

    {#if fileEpisodeAddStore.tsv.scriptPreview}
      <TsvConfigSection {onDetectScriptLanguage} />
    {/if}

    {#if learningTargetLanguageOptions.length > 0}
      <div class="mb-4">
        <Label class="mb-2 block" for="learningLanguage">
          {t('components.fileEpisodeForm.learningLanguageLabel')}
        </Label>
        {#if fileEpisodeAddStore.languageDetectionWarningMessage}
          <div class="mb-2 text-sm text-yellow-600">
            {fileEpisodeAddStore.languageDetectionWarningMessage}
          </div>
        {/if}
        <Select
          id="learningLanguage"
          bind:value={fileEpisodeAddStore.selectedStudyLanguage}
          items={learningTargetLanguageOptions}
        ></Select>
      </div>
    {/if}

    {#if shouldShowTtsSection}
      <div class="mb-4">
        <Label class="flex items-center gap-2">
          <Checkbox
            checked={fileEpisodeAddStore.shouldGenerateAudio}
            onchange={(e) => handleTtsCheckboxChange((e.currentTarget as HTMLInputElement).checked)}
            class="h-4 w-4"
            disabled={isTxtScriptFile}
          />
          {t('components.fileEpisodeForm.generateAudioLabel')}
        </Label>
      </div>

      {#if fileEpisodeAddStore.shouldGenerateAudio}
        <TtsConfigSection />
      {/if}
    {/if}

    {#if fileEpisodeAddStore.errorMessage}
      <div class="mb-4">
        <div class="text-sm text-red-600">{fileEpisodeAddStore.errorMessage}</div>
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" {disabled} onclick={handleClose}>
        {t('common.cancel')}
      </Button>
      <Button data-testid="file-episode-add-submit" {disabled} onclick={handleSubmit}>
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
