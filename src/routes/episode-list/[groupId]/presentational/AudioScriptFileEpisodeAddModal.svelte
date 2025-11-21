<script lang="ts">
  import type { AudioScriptFileEpisodeAddPayload } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { audioScriptFileEpisodeAddStore } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
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
  let previousOpen = false;

  function resetFormState() {
    audioScriptFileEpisodeAddStore.reset();
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
    isSubmitting || audioScriptFileEpisodeAddStore.tsv.isFetchingScriptPreview
  );

  let learningTargetLanguageOptions = $derived(
    audioScriptFileEpisodeAddStore.learningTargetLanguages.map((lang) => ({
      value: lang,
      name: `${t(bcp47ToTranslationKey(lang)!)} (${bcp47ToLanguageName(lang)})`,
    })) || []
  );

  async function handleScriptFileChange(filePath: string | null) {
    audioScriptFileEpisodeAddStore.scriptFilePath = filePath;
    if (!filePath) {
      audioScriptFileEpisodeAddStore.tsv.reset();
      audioScriptFileEpisodeAddStore.selectedStudyLanguage = null;
      await onDetectScriptLanguage();
      return;
    }

    const normalized = filePath.toLowerCase();
    if (normalized.endsWith('.tsv')) {
      await onTsvFileSelected(filePath);
    } else {
      audioScriptFileEpisodeAddStore.tsv.reset();
      await onDetectScriptLanguage();
    }
  }

  async function handleSubmit() {
    if (isSubmitting || !audioScriptFileEpisodeAddStore.validateForm()) {
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
        placeholder={t('components.fileEpisodeForm.titlePlaceholder')}
        value={audioScriptFileEpisodeAddStore.title}
        oninput={(e) =>
          (audioScriptFileEpisodeAddStore.title = (e.currentTarget as HTMLInputElement).value)}
        type="text"
      />
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="audioFile">
        {t('components.fileEpisodeForm.audioFileLabel')}
      </Label>
      <FileSelect
        accept="audio/*"
        value={audioScriptFileEpisodeAddStore.audioFilePath}
        onFileSelected={(file) => {
          audioScriptFileEpisodeAddStore.audioFilePath = file;
        }}
        onClear={() => {
          audioScriptFileEpisodeAddStore.audioFilePath = null;
        }}
        id="audioFile"
        dataTestId="audio-file-select"
      />
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="scriptFile">
        {t('components.fileEpisodeForm.scriptFileLabel')}
      </Label>
      <FileSelect
        accept=".srt,.sswt,.tsv,.vtt,.txt"
        value={audioScriptFileEpisodeAddStore.scriptFilePath}
        onFileSelected={(file) => handleScriptFileChange(file)}
        onClear={() => handleScriptFileChange(null)}
        id="scriptFile"
        dataTestId="script-file-select"
      />
    </div>

    {#if audioScriptFileEpisodeAddStore.tsv.scriptPreview}
      <TsvConfigSection {onDetectScriptLanguage} />
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
      </div>
    {/if}

    {#if audioScriptFileEpisodeAddStore.errorMessage}
      <div class="mb-4">
        <div class="text-sm text-red-600">{audioScriptFileEpisodeAddStore.errorMessage}</div>
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" {disabled} onclick={handleClose}>
        {t('common.cancel')}
      </Button>
      <Button data-testid="audio-script-file-episode-add-submit" {disabled} onclick={handleSubmit}>
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
