<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Label, Select } from 'flowbite-svelte';

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
</script>

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
              (episodeAddStore.ttsSelectedVoiceName = (e.currentTarget as HTMLSelectElement).value)}
          />
        </div>
      {/if}
    {/if}
  {/if}
</div>
