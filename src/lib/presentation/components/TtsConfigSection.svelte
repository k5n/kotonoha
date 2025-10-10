<script lang="ts">
  import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Button, Label, Select } from 'flowbite-svelte';

  function handlePlaySample() {
    const currentSpeaker = ttsConfigStore.currentSpeaker;
    if (currentSpeaker?.sampleUrl) {
      if (ttsConfigStore.isPlayingSample) {
        ttsConfigStore.stopSample();
      } else {
        ttsConfigStore.playSample(currentSpeaker.sampleUrl);
      }
    }
  }
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
        items={ttsConfigStore.languageOptions}
        value={ttsConfigStore.selectedLanguage}
        onchange={(e) =>
          (ttsConfigStore.selectedLanguage = (e.currentTarget as HTMLSelectElement).value)}
      />
    </div>

    <!-- Quality Selection -->
    {#if ttsConfigStore.qualityOptions.length > 0}
      <div>
        <Label class="mb-2 block" for="tts-quality">
          {t('components.ttsConfigSection.ttsQualityLabel')}
        </Label>
        <Select
          id="tts-quality"
          items={ttsConfigStore.qualityOptions}
          value={ttsConfigStore.selectedQuality}
          onchange={(e) =>
            (ttsConfigStore.selectedQuality = (e.currentTarget as HTMLSelectElement).value)}
        />
      </div>

      <!-- Voice Name Selection -->
      {#if ttsConfigStore.voiceOptions.length > 0}
        <div>
          <Label class="mb-2 block" for="tts-voice">
            {t('components.ttsConfigSection.ttsVoiceLabel')}
          </Label>
          <Select
            id="tts-voice"
            items={ttsConfigStore.voiceOptions}
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
              items={ttsConfigStore.speakerOptions}
              value={ttsConfigStore.selectedSpeakerId.toString()}
              onchange={(e) =>
                (ttsConfigStore.selectedSpeakerId = parseInt(
                  (e.currentTarget as HTMLSelectElement).value
                ))}
            />
          </div>
        {/if}

        <!-- Sample Playback -->
        {#if ttsConfigStore.currentSpeaker?.sampleUrl}
          <div>
            <Button
              onclick={handlePlaySample}
              color="light"
              size="sm"
              disabled={!ttsConfigStore.currentSpeaker?.sampleUrl}
            >
              {#if ttsConfigStore.isPlayingSample}
                ⏹️ {t('components.ttsConfigSection.stopSample')}
              {:else}
                ▶️ {t('components.ttsConfigSection.playSample')}
              {/if}
            </Button>
          </div>
        {/if}
      {/if}
    {/if}
  {/if}
</div>
