<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { TtsEpisodeAddPayload } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import { ttsEpisodeAddStore } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import FileSelect from '$lib/presentation/components/presentational/FileSelect.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Heading, Input, Label, Modal, Select } from 'flowbite-svelte';
  import TsvConfigSection from './TsvConfigSection.svelte';
  import TtsConfigSection from './TtsConfigSection.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: TtsEpisodeAddPayload | null) => Promise<void>;
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

  function resetFormState() {
    ttsEpisodeAddStore.reset();
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
      ttsEpisodeAddStore.tsv.isFetchingScriptPreview ||
      ttsEpisodeAddStore.tts.isFetchingVoices
  );

  let learningTargetLanguageOptions = $derived(
    ttsEpisodeAddStore.learningTargetLanguages.map((lang) => ({
      value: lang,
      name: `${t(bcp47ToTranslationKey(lang)!)} (${bcp47ToLanguageName(lang)})`,
    })) || []
  );

  async function processScriptFile(filePath: string) {
    const lowered = filePath.toLowerCase();
    try {
      if (lowered.endsWith('.tsv')) {
        await onTsvFileSelected(filePath);
      }
      await onDetectScriptLanguage();
      await onTtsEnabled();
    } catch (error) {
      console.error('Failed to prepare script file for TTS episode:', error);
      ttsEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorSubmissionFailed');
    }
  }

  async function handleScriptFileChange(filePath: string | null) {
    ttsEpisodeAddStore.scriptFilePath = filePath;
    if (!filePath) {
      return;
    }
    await processScriptFile(filePath);
  }

  function validateLocal(): boolean {
    return ttsEpisodeAddStore.validateForm();
  }

  async function handleSubmit() {
    if (isSubmitting || !validateLocal()) {
      return;
    }

    try {
      isSubmitting = true;
      const payload = ttsEpisodeAddStore.buildPayload();
      await onSubmitRequested(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to submit TTS episode:', error);
      ttsEpisodeAddStore.errorMessage = t('components.fileEpisodeForm.errorSubmissionFailed');
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
      <Label class="mb-2 block" for="tts-title">
        {t('components.fileEpisodeForm.titleLabel')}
      </Label>
      <Input
        id="tts-title"
        placeholder={t('components.fileEpisodeForm.titlePlaceholder')}
        value={ttsEpisodeAddStore.title}
        oninput={(e) => (ttsEpisodeAddStore.title = (e.currentTarget as HTMLInputElement).value)}
        type="text"
      />
    </div>

    <div class="mb-4">
      <Label class="mb-2 block" for="tts-script-file">
        {t('components.fileEpisodeForm.scriptFileLabel')}
      </Label>
      <FileSelect
        accept=".srt,.sswt,.tsv,.vtt,.txt"
        value={ttsEpisodeAddStore.scriptFilePath}
        onFileSelected={(file) => handleScriptFileChange(file)}
        onClear={() => handleScriptFileChange(null)}
        id="tts-script-file"
        dataTestId="tts-script-file-select"
      />
    </div>

    {#if ttsEpisodeAddStore.tsv.scriptPreview}
      <TsvConfigSection {onDetectScriptLanguage} />
    {/if}

    {#if learningTargetLanguageOptions.length > 0}
      <div class="mb-4">
        <Label class="mb-2 block" for="tts-learning-language">
          {t('components.fileEpisodeForm.learningLanguageLabel')}
        </Label>
        {#if ttsEpisodeAddStore.languageDetectionWarningMessage}
          <div class="mb-2 text-sm text-yellow-600">
            {ttsEpisodeAddStore.languageDetectionWarningMessage}
          </div>
        {/if}
        <Select
          id="tts-learning-language"
          data-testid="learningLanguage"
          bind:value={ttsEpisodeAddStore.selectedStudyLanguage}
          items={learningTargetLanguageOptions}
        ></Select>
      </div>
    {/if}

    <div class="mb-4">
      <TtsConfigSection />
    </div>

    {#if ttsEpisodeAddStore.errorMessage}
      <div class="mb-4 text-sm text-red-600">{ttsEpisodeAddStore.errorMessage}</div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" {disabled} onclick={handleClose}>
        {t('common.cancel')}
      </Button>
      <Button data-testid="tts-episode-add-submit" {disabled} onclick={handleSubmit}>
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
