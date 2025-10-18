<script lang="ts">
  import { ttsConfigStore } from '$lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Label, Select } from 'flowbite-svelte';

  let audioElement = $state<HTMLAudioElement | null>(null);
  let isPlayingSample = $state(false);

  const languageOptions = $derived(
    ttsConfigStore.learningTargetVoices
      ?.map((voice) => voice.language)
      .filter((lang, index, self) => self.findIndex((l) => l.family === lang.family) === index)
      .map((lang) => ({
        value: lang.family,
        name: `${t(bcp47ToTranslationKey(lang.family)!)} (${bcp47ToLanguageName(lang.family)})`,
      })) || []
  );

  const selectedLanguageVoices = $derived(
    ttsConfigStore.learningTargetVoices?.filter(
      (voice) => voice.language.family === ttsConfigStore.selectedLanguage
    ) || []
  );

  const availableQualities = $derived(
    Array.from(new Set(selectedLanguageVoices.map((v) => v.quality)))
  );

  const qualityOptions = $derived(
    availableQualities.map((quality) => ({ value: quality, name: quality }))
  );

  const selectedLanguageQualityVoices = $derived(
    selectedLanguageVoices.filter((voice) => voice.quality === ttsConfigStore.selectedQuality) || []
  );

  const voiceOptions = $derived(
    selectedLanguageQualityVoices.map((voice) => ({
      value: voice.name,
      name: `${voice.name} (${voice.language.region})`,
    })) || []
  );

  const currentVoice = $derived(ttsConfigStore.selectedVoice);

  const speakerOptions = $derived(
    currentVoice?.speakers.map((speaker) => ({
      value: speaker.id.toString(),
      name: speaker.name,
    })) || []
  );

  const currentSpeaker = $derived(
    currentVoice?.speakers.find((s) => s.id.toString() === ttsConfigStore.selectedSpeakerId) ||
      (currentVoice?.speakers.length === 0
        ? { id: 0, name: currentVoice.name, sampleUrl: '' }
        : null)
  );

  const sampleUrl = $derived(currentSpeaker?.sampleUrl || null);

  function playSample(url: string) {
    if (audioElement) {
      audioElement.pause();
    }
    audioElement = new Audio(url);
    audioElement.volume = 0.8;
    audioElement.addEventListener('ended', () => {
      isPlayingSample = false;
    });
    audioElement.addEventListener('error', () => {
      // You might want to show an error to the user here
      console.error('Error playing audio sample.');
      isPlayingSample = false;
    });
    audioElement.play();
    isPlayingSample = true;
  }

  function stopSample() {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    isPlayingSample = false;
  }

  function handlePlaySample() {
    if (sampleUrl) {
      if (isPlayingSample) {
        stopSample();
      } else {
        playSample(sampleUrl);
      }
    }
  }

  // NOTE: Flowbite Svelte's Select component supports two-way binding only. So we create proxies here.
  type SelectableKeys =
    | 'selectedLanguage'
    | 'selectedQuality'
    | 'selectedVoiceName'
    | 'selectedSpeakerId';

  function createSelectionProxy<K extends SelectableKeys>(key: K) {
    type ValueType = (typeof ttsConfigStore)[K];

    return {
      get value(): ValueType {
        return ttsConfigStore[key];
      },
      set value(newValue: ValueType) {
        stopSample();
        ttsConfigStore[key] = newValue;
      },
    };
  }

  const language = createSelectionProxy('selectedLanguage');
  const quality = createSelectionProxy('selectedQuality');
  const voiceName = createSelectionProxy('selectedVoiceName');
  const speakerId = createSelectionProxy('selectedSpeakerId');
</script>

<div class="mb-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
    {t('components.ttsConfigSection.configTitle')}
  </h4>
  {#if ttsConfigStore.isFetchingVoices}
    <div class="text-sm text-gray-600 dark:text-gray-400">
      {t('components.ttsConfigSection.loadingVoices')}
    </div>
  {:else if ttsConfigStore.errorMessage}
    <div class="text-sm text-red-600">
      {ttsConfigStore.errorMessage}
    </div>
  {:else if (ttsConfigStore.learningTargetVoices || []).length > 0}
    {#if ttsConfigStore.warningMessage}
      <div class="text-sm text-yellow-600">
        {ttsConfigStore.warningMessage}
      </div>
    {/if}

    <!-- Language Selection -->
    <div>
      <Label class="mb-2 block" for="tts-language">
        {t('components.ttsConfigSection.languageLabel')}
      </Label>
      <Select id="tts-language" items={languageOptions} bind:value={language.value} />
    </div>

    <!-- Quality Selection -->
    {#if qualityOptions.length > 0}
      <div>
        <Label class="mb-2 block" for="tts-quality">
          {t('components.ttsConfigSection.qualityLabel')}
        </Label>
        <Select id="tts-quality" items={qualityOptions} bind:value={quality.value} />
      </div>

      <!-- Voice Name Selection -->
      {#if voiceOptions.length > 0}
        <div>
          <Label class="mb-2 block" for="tts-voice">
            {t('components.ttsConfigSection.voiceLabel')}
          </Label>
          <Select id="tts-voice" items={voiceOptions} bind:value={voiceName.value} />
        </div>

        <!-- Speaker Selection -->
        {#if speakerOptions.length > 1}
          <div>
            <Label class="mb-2 block" for="tts-speaker">
              {t('components.ttsConfigSection.speakerLabel')}
            </Label>
            <Select id="tts-speaker" items={speakerOptions} bind:value={speakerId.value} />
          </div>
        {/if}

        <!-- Sample Playback -->
        {#if sampleUrl}
          <div>
            <Button onclick={handlePlaySample} color="light" size="sm">
              {#if isPlayingSample}
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
