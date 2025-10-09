<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Checkbox, Input, Label, Select } from 'flowbite-svelte';

  type Props = {
    onTsvFileSelected: (filePath: string) => void;
    onSubmit: () => void;
    onTtsEnabled: () => void;
  };

  let { onTsvFileSelected, onSubmit, onTtsEnabled }: Props = $props();

  let disabled = $derived(
    episodeAddStore.isSubmitting ||
      episodeAddStore.isFetchingScriptPreview ||
      episodeAddStore.isFetchingTtsVoices
  );

  let ttsLanguageOptions = $derived(
    episodeAddStore.ttsAvailableVoices?.voices
      .map((voice) => voice.language)
      .filter((lang, index, self) => self.findIndex((l) => l.family === lang.family) === index)
      .map((lang) => ({
        value: lang.family,
        name: `${t(bcp47ToTranslationKey(lang.family)!)} (${bcp47ToLanguageName(lang.family)})`,
      })) || []
  );

  let ttsQualityOptions = $derived(
    Array.from(
      new Set(
        (episodeAddStore.ttsAvailableVoices?.voices || [])
          .filter((voice) => voice.language.family === episodeAddStore.ttsSelectedLanguage)
          .map((voice) => voice.quality)
      )
    ).map((quality) => ({ value: quality, name: quality }))
  );

  let ttsVoiceOptions = $derived(
    (episodeAddStore.ttsAvailableVoices?.voices || [])
      .filter(
        (voice) =>
          voice.language.family === episodeAddStore.ttsSelectedLanguage &&
          voice.quality === episodeAddStore.ttsSelectedQuality
      )
      .map((voice) => ({
        value: voice.name,
        name: `${voice.name} (${voice.language.region})`,
      }))
  );

  async function handleScriptFileChange(filePath: string | null) {
    episodeAddStore.setScriptFilePath(filePath);
    if (filePath && filePath.toLowerCase().endsWith('.tsv')) {
      onTsvFileSelected(filePath);
    } else {
      episodeAddStore.shouldGenerateAudio = episodeAddStore.isTxtScriptFile;
      episodeAddStore.completeScriptPreviewFetching(null);
    }
  }

  function handleTtsCheckboxChange(checked: boolean) {
    episodeAddStore.shouldGenerateAudio = checked;
    if (checked) {
      onTtsEnabled();
    }
  }

  async function handleSubmit() {
    const errorMessageKey = episodeAddStore.validateFileForm();
    if (errorMessageKey) {
      episodeAddStore.fileFormErrorMessage = t(errorMessageKey);
      return;
    }

    onSubmit();
  }
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
  <Input
    id="title"
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={episodeAddStore.fileTitle}
    oninput={(e) => (episodeAddStore.fileTitle = (e.currentTarget as HTMLInputElement).value)}
    type="text"
  />
</div>

{#if !episodeAddStore.shouldGenerateAudio}
  <div class="mb-4">
    <Label class="mb-2 block" for="audioFile">
      {t('components.episodeAddModal.audioFileLabel')}
    </Label>
    <FileSelect
      accept="audio/*"
      onFileSelected={(file) => episodeAddStore.setAudioFilePath(file || null)}
      id="audioFile"
    />
  </div>
{/if}

<div class="mb-4">
  <Label class="mb-2 block" for="scriptFile">
    {t('components.episodeAddModal.scriptFileLabel')}
  </Label>
  <FileSelect
    accept=".srt,.sswt,.tsv,.vtt,.txt"
    onFileSelected={(file) => handleScriptFileChange(file || null)}
    id="scriptFile"
  />
</div>

{#if episodeAddStore.hasOnlyScriptFile}
  <div class="mb-4">
    <Label class="flex items-center gap-2">
      <Checkbox
        checked={episodeAddStore.shouldGenerateAudio}
        onchange={(e) => handleTtsCheckboxChange((e.currentTarget as HTMLInputElement).checked)}
        class="h-4 w-4"
        disabled={episodeAddStore.isTxtScriptFile}
      />
      {t('components.episodeAddModal.generateAudioLabel')}
    </Label>
  </div>

  {#if episodeAddStore.shouldGenerateAudio}
    <div class="mb-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
        {t('components.episodeAddModal.ttsConfigTitle')}
      </h4>

      {#if episodeAddStore.isFetchingTtsVoices}
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {t('components.episodeAddModal.loadingVoices')}
        </div>
      {:else if episodeAddStore.ttsErrorMessage}
        <div class="text-sm text-red-600">
          {episodeAddStore.ttsErrorMessage}
        </div>
      {:else if (episodeAddStore.ttsAvailableVoices?.voices || []).length > 0}
        <!-- Language Selection -->
        <div>
          <Label class="mb-2 block" for="tts-language">
            {t('components.episodeAddModal.ttsLanguageLabel')}
          </Label>
          <Select
            id="tts-language"
            items={ttsLanguageOptions}
            value={episodeAddStore.ttsSelectedLanguage}
            onchange={(e) =>
              (episodeAddStore.ttsSelectedLanguage = (e.currentTarget as HTMLSelectElement).value)}
          />
        </div>

        <!-- Quality Selection -->
        {#if ttsQualityOptions.length > 0}
          <div>
            <Label class="mb-2 block" for="tts-quality">
              {t('components.episodeAddModal.ttsQualityLabel')}
            </Label>
            <Select
              id="tts-quality"
              items={ttsQualityOptions}
              value={episodeAddStore.ttsSelectedQuality}
              onchange={(e) =>
                (episodeAddStore.ttsSelectedQuality = (e.currentTarget as HTMLSelectElement).value)}
            />
          </div>

          <!-- Voice Name Selection -->
          {#if ttsVoiceOptions.length > 0}
            <div>
              <Label class="mb-2 block" for="tts-voice">
                {t('components.episodeAddModal.ttsVoiceLabel')}
              </Label>
              <Select
                id="tts-voice"
                items={ttsVoiceOptions}
                value={episodeAddStore.ttsSelectedVoiceName}
                onchange={(e) =>
                  (episodeAddStore.ttsSelectedVoiceName = (
                    e.currentTarget as HTMLSelectElement
                  ).value)}
              />
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  {/if}
{/if}

{#if episodeAddStore.scriptPreview}
  <TsvConfigSection />
{/if}

{#if episodeAddStore.fileFormErrorMessage}
  <div class="mb-4">
    <div class="text-sm text-red-600">{episodeAddStore.fileFormErrorMessage}</div>
  </div>
{/if}

<div class="flex justify-end gap-2">
  <Button color="gray" {disabled} onclick={episodeAddStore.close}>
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button {disabled} onclick={handleSubmit}>
    {episodeAddStore.isSubmitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
