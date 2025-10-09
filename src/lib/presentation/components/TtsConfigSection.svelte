<script lang="ts">
  import { fileEpisodeAddStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Label, Select } from 'flowbite-svelte';

  let ttsLanguageOptions = $derived(
    fileEpisodeAddStore.ttsAvailableVoices?.voices
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
        (fileEpisodeAddStore.ttsAvailableVoices?.voices || [])
          .filter((voice) => voice.language.family === fileEpisodeAddStore.ttsSelectedLanguage)
          .map((voice) => voice.quality)
      )
    ).map((quality) => ({ value: quality, name: quality }))
  );

  let ttsVoiceOptions = $derived(
    (fileEpisodeAddStore.ttsAvailableVoices?.voices || [])
      .filter(
        (voice) =>
          voice.language.family === fileEpisodeAddStore.ttsSelectedLanguage &&
          voice.quality === fileEpisodeAddStore.ttsSelectedQuality
      )
      .map((voice) => ({
        value: voice.name,
        name: `${voice.name} (${voice.language.region})`,
      }))
  );
</script>

<div class="mb-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
    {t('components.episodeAddModal.ttsConfigTitle')}
  </h4>

  {#if fileEpisodeAddStore.isFetchingTtsVoices}
    <div class="text-sm text-gray-600 dark:text-gray-400">
      {t('components.episodeAddModal.loadingVoices')}
    </div>
  {:else if fileEpisodeAddStore.ttsErrorMessage}
    <div class="text-sm text-red-600">
      {fileEpisodeAddStore.ttsErrorMessage}
    </div>
  {:else if (fileEpisodeAddStore.ttsAvailableVoices?.voices || []).length > 0}
    <!-- Language Selection -->
    <div>
      <Label class="mb-2 block" for="tts-language">
        {t('components.episodeAddModal.ttsLanguageLabel')}
      </Label>
      <Select
        id="tts-language"
        items={ttsLanguageOptions}
        value={fileEpisodeAddStore.ttsSelectedLanguage}
        onchange={(e) =>
          (fileEpisodeAddStore.ttsSelectedLanguage = (e.currentTarget as HTMLSelectElement).value)}
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
          value={fileEpisodeAddStore.ttsSelectedQuality}
          onchange={(e) =>
            (fileEpisodeAddStore.ttsSelectedQuality = (e.currentTarget as HTMLSelectElement).value)}
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
            value={fileEpisodeAddStore.ttsSelectedVoiceName}
            onchange={(e) =>
              (fileEpisodeAddStore.ttsSelectedVoiceName = (
                e.currentTarget as HTMLSelectElement
              ).value)}
          />
        </div>
      {/if}
    {/if}
  {/if}
</div>
