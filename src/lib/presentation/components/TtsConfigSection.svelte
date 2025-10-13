<script lang="ts">
  import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Button, Label, Select } from 'flowbite-svelte';

  function handlePlaySample() {
    const sampleUrl = ttsConfigStore.sampleUrl;
    if (sampleUrl) {
      if (ttsConfigStore.isPlayingSample) {
        ttsConfigStore.stopSample();
      } else {
        ttsConfigStore.playSample(sampleUrl);
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
  {:else if (ttsConfigStore.learningTargetVoices?.voices || []).length > 0}
    {#if ttsConfigStore.warningMessage}
      <div class="text-sm text-yellow-600">
        {ttsConfigStore.warningMessage}
      </div>
    {/if}

    <!-- Language Selection -->
    <div>
      <Label class="mb-2 block" for="tts-language">
        {t('components.ttsConfigSection.ttsLanguageLabel')}
      </Label>
      <Select
        id="tts-language"
        items={ttsConfigStore.languageOptions}
        bind:value={ttsConfigStore.selectedLanguage}
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
          bind:value={ttsConfigStore.selectedQuality}
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
            bind:value={ttsConfigStore.selectedVoiceName}
          />
        </div>

        <!-- Speaker Selection -->
        {#if ttsConfigStore.speakerOptions.length > 1}
          <div>
            <Label class="mb-2 block" for="tts-speaker">
              {t('components.ttsConfigSection.ttsSpeakerLabel')}
            </Label>
            <Select
              id="tts-speaker"
              items={ttsConfigStore.speakerOptions}
              bind:value={ttsConfigStore.selectedSpeakerId}
            />
          </div>
        {/if}

        <!-- Sample Playback -->
        {#if ttsConfigStore.sampleUrl}
          <div>
            <Button onclick={handlePlaySample} color="light" size="sm">
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
