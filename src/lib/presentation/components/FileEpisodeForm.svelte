<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
  import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import TtsConfigSection from '$lib/presentation/components/TtsConfigSection.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Checkbox, Input, Label, Select } from 'flowbite-svelte';

  type Props = {
    onTsvFileSelected: (filePath: string) => Promise<void>;
    onSubmit: () => Promise<void>;
    onTtsEnabled: () => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
  };

  let { onTsvFileSelected, onSubmit, onTtsEnabled, onDetectScriptLanguage }: Props = $props();

  let disabled = $derived(
    episodeAddStore.isSubmitting ||
      fileEpisodeAddStore.tsv.isFetchingScriptPreview ||
      fileEpisodeAddStore.tts.isFetchingVoices
  );

  // Local UI-derived state moved from the store
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
      // immediate behavior: .txt files imply TTS generation
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

  async function handleSubmit() {
    if (validateLocal()) {
      onSubmit();
    }
  }

  // Local validation moved from the store. Writes errors back into the store's errorMessageKey
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
</script>

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
  <Button color="gray" {disabled} onclick={episodeAddStore.close}>
    {t('common.cancel')}
  </Button>
  <Button {disabled} onclick={handleSubmit}>
    {episodeAddStore.isSubmitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
