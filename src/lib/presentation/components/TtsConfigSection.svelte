<script lang="ts">
  import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Label, Select } from 'flowbite-svelte';

  let ttsLanguageOptions = $derived(
    ttsConfigStore.availableVoices?.voices
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
        (ttsConfigStore.availableVoices?.voices || [])
          .filter((voice) => voice.language.family === ttsConfigStore.selectedLanguage)
          .map((voice) => voice.quality)
      )
    ).map((quality) => ({ value: quality, name: quality }))
  );

  let ttsVoiceOptions = $derived(
    (ttsConfigStore.availableVoices?.voices || [])
      .filter(
        (voice) =>
          voice.language.family === ttsConfigStore.selectedLanguage &&
          voice.quality === ttsConfigStore.selectedQuality
      )
      .map((voice) => ({
        value: voice.name,
        name: `${voice.name} (${voice.language.region})`,
      }))
  );

  let ttsSpeakerOptions = $derived(
    ttsConfigStore.availableSpeakers.map((speaker) => ({
      value: speaker.id.toString(),
      name: speaker.name,
    }))
  );
</script>

<div class="mb-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
    {t('components.ttsConfigSection.ttsConfigTitle')}
  </h4>

  {#if ttsConfigStore.isFetchingVoices}
    <div class="text-sm text-gray-600 dark:text-gray-400">
      {t('components.ttsConfigSection.loadingVoices')}
    </div>
  {:else if ttsConfigStore.errorMessage}
    <div class="text-sm text-red-600">
      {ttsConfigStore.errorMessage}
    </div>
  {:else if (ttsConfigStore.availableVoices?.voices || []).length > 0}
    <!-- Language Selection -->
    <div>
      <Label class="mb-2 block" for="tts-language">
        {t('components.ttsConfigSection.ttsLanguageLabel')}
      </Label>
      <Select
        id="tts-language"
        items={ttsLanguageOptions}
        value={ttsConfigStore.selectedLanguage}
        onchange={(e) =>
          (ttsConfigStore.selectedLanguage = (e.currentTarget as HTMLSelectElement).value)}
      />
    </div>

    <!-- Quality Selection -->
    {#if ttsQualityOptions.length > 0}
      <div>
        <Label class="mb-2 block" for="tts-quality">
          {t('components.ttsConfigSection.ttsQualityLabel')}
        </Label>
        <Select
          id="tts-quality"
          items={ttsQualityOptions}
          value={ttsConfigStore.selectedQuality}
          onchange={(e) =>
            (ttsConfigStore.selectedQuality = (e.currentTarget as HTMLSelectElement).value)}
        />
      </div>

      <!-- Voice Name Selection -->
      {#if ttsVoiceOptions.length > 0}
        <div>
          <Label class="mb-2 block" for="tts-voice">
            {t('components.ttsConfigSection.ttsVoiceLabel')}
          </Label>
          <Select
            id="tts-voice"
            items={ttsVoiceOptions}
            value={ttsConfigStore.selectedVoiceName}
            onchange={(e) =>
              (ttsConfigStore.selectedVoiceName = (e.currentTarget as HTMLSelectElement).value)}
          />
        </div>

        <!-- Speaker Selection -->
        {#if ttsConfigStore.availableSpeakers.length > 1}
          <div>
            <Label class="mb-2 block" for="tts-speaker">
              {t('components.ttsConfigSection.ttsSpeakerLabel')}
            </Label>
            <Select
              id="tts-speaker"
              items={ttsSpeakerOptions}
              value={ttsConfigStore.selectedSpeakerId.toString()}
              onchange={(e) =>
                (ttsConfigStore.selectedSpeakerId = parseInt(
                  (e.currentTarget as HTMLSelectElement).value
                ))}
            />
          </div>
        {/if}
      {/if}
    {/if}
  {/if}
</div>
