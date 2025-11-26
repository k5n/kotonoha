<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { Voice } from '$lib/domain/entities/voice';
  import { Button, Label, Select } from 'flowbite-svelte';

  type Props = {
    selectedLanguageVoices: readonly Voice[];
    selectedQuality: string;
    selectedVoice: Voice | null;
    selectedSpeakerId: string;
    isFetchingVoices: boolean;
    errorMessage: string;
    onSelectedQualityChange: (quality: string) => void;
    onSelectedVoiceChange: (voiceName: string) => void;
    onSelectedSpeakerIdChange: (speakerId: string) => void;
  };
  let {
    selectedLanguageVoices,
    selectedQuality,
    selectedVoice,
    selectedSpeakerId,
    isFetchingVoices,
    errorMessage,
    onSelectedQualityChange,
    onSelectedVoiceChange,
    onSelectedSpeakerIdChange,
  }: Props = $props();

  let audioElement = $state<HTMLAudioElement | null>(null);
  let isPlayingSample = $state(false);

  const availableQualities = $derived(
    Array.from(new Set(selectedLanguageVoices.map((v) => v.quality)))
  );

  const qualityOptions = $derived(
    availableQualities.map((quality) => ({ value: quality, name: quality }))
  );

  const selectedLanguageQualityVoices = $derived(
    selectedLanguageVoices.filter((voice) => voice.quality === selectedQuality) || []
  );

  const voiceOptions = $derived(
    selectedLanguageQualityVoices.map((voice) => ({
      value: voice.name,
      name: `${voice.name} (${voice.language.region})`,
    })) || []
  );

  const speakerOptions = $derived(
    selectedVoice?.speakers.map((speaker) => ({
      value: speaker.id.toString(),
      name: speaker.name,
    })) || []
  );

  const currentSpeaker = $derived(
    selectedVoice?.speakers.find((s) => s.id.toString() === selectedSpeakerId) ||
      (selectedVoice?.speakers.length === 0
        ? { id: 0, name: selectedVoice.name, sampleUrl: '' }
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
  function createSelectionProxy<K>(getter: () => K, setter: (value: K) => void) {
    return {
      get value(): K {
        return getter();
      },
      set value(newValue: K) {
        stopSample();
        setter(newValue);
      },
    };
  }

  const quality = createSelectionProxy(() => selectedQuality, onSelectedQualityChange);
  const voiceName = createSelectionProxy(() => selectedVoice?.name || '', onSelectedVoiceChange);
  const speakerId = createSelectionProxy(() => selectedSpeakerId, onSelectedSpeakerIdChange);
</script>

<div class="mb-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
    {t('components.ttsConfigSection.configTitle')}
  </h4>
  {#if isFetchingVoices}
    <div class="text-sm text-gray-600 dark:text-gray-400">
      {t('components.ttsConfigSection.loadingVoices')}
    </div>
  {:else if errorMessage}
    <div class="text-sm text-red-600">{errorMessage}</div>
  {:else if selectedLanguageVoices.length > 0}
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
