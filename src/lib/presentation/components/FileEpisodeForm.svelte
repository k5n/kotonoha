<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
  import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import TtsConfigSection from '$lib/presentation/components/TtsConfigSection.svelte';
  import { Button, Checkbox, Input, Label } from 'flowbite-svelte';

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

  async function handleScriptFileChange(filePath: string | null) {
    fileEpisodeAddStore.scriptFilePath = filePath;
    if (filePath && filePath.toLowerCase().endsWith('.tsv')) {
      await onTsvFileSelected(filePath);
    } else if (filePath && filePath.toLowerCase().endsWith('.txt')) {
      // immediate behavior: .txt files imply TTS generation
      await handleTtsCheckboxChange(true);
    } else {
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
      fileEpisodeAddStore.errorMessageKey = 'components.fileEpisodeForm.errorTitleRequired';
      return false;
    }
    if (!audioFilePathValue && !fileEpisodeAddStore.shouldGenerateAudio) {
      fileEpisodeAddStore.errorMessageKey = 'components.fileEpisodeForm.errorAudioRequired';
      return false;
    }
    if (!scriptFilePathValue) {
      fileEpisodeAddStore.errorMessageKey = 'components.fileEpisodeForm.errorScriptFileRequired';
      return false;
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        fileEpisodeAddStore.errorMessageKey = 'components.fileEpisodeForm.errorTsvColumnRequired';
        return false;
      }
    }

    // clear error (store's errorMessage remains authoritative for resets)
    fileEpisodeAddStore.errorMessageKey = '';
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

{#if fileEpisodeAddStore.errorMessageKey}
  <div class="mb-4">
    <div class="text-sm text-red-600">{t(fileEpisodeAddStore.errorMessageKey)}</div>
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
