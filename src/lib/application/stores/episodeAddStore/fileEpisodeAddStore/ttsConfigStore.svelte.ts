import { t } from '$lib/application/stores/i18n.svelte';
import type { Voices } from '$lib/domain/entities/voice';
import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';

let availableVoices = $state(null as Voices | null);
let learningTargetVoices = $state(null as Voices | null);
let isFetchingVoices = $state(false);
let selectedLanguage = $state('en');
let selectedVoiceName = $state('');
let selectedQuality = $state('');
let selectedSpeakerId = $state(0);
let errorMessage = $state('');
let audioElement = $state(null as HTMLAudioElement | null);
let isPlayingSample = $state(false);

const availableSpeakers = $derived.by(() => {
  const currentVoice = learningTargetVoices?.voices.find((v) => v.name === selectedVoiceName);
  if (!currentVoice) return [];
  if (currentVoice.speakers.length === 0) {
    return [{ id: 0, name: currentVoice.name, sampleUrl: currentVoice.files[0]?.url || '' }];
  }
  return currentVoice.speakers;
});

const languageOptions = $derived(
  learningTargetVoices?.voices
    .map((voice) => voice.language)
    .filter((lang, index, self) => self.findIndex((l) => l.family === lang.family) === index)
    .map((lang) => ({
      value: lang.family,
      name: `${t(bcp47ToTranslationKey(lang.family)!)} (${bcp47ToLanguageName(lang.family)})`,
    })) || []
);

const qualityOptions = $derived(
  Array.from(
    new Set(
      (learningTargetVoices?.voices || [])
        .filter((voice) => voice.language.family === selectedLanguage)
        .map((voice) => voice.quality)
    )
  ).map((quality) => ({ value: quality, name: quality }))
);

const voiceOptions = $derived(
  (learningTargetVoices?.voices || [])
    .filter(
      (voice) => voice.language.family === selectedLanguage && voice.quality === selectedQuality
    )
    .map((voice) => ({
      value: voice.name,
      name: `${voice.name} (${voice.language.region})`,
    })) || []
);

const speakerOptions = $derived(
  availableSpeakers.map((speaker) => ({
    value: speaker.id.toString(),
    name: speaker.name,
  }))
);

const currentSpeaker = $derived(
  availableSpeakers.find((speaker) => speaker.id === selectedSpeakerId) || null
);

function setSelectedLanguage(language: string) {
  selectedLanguage = language;
  // Reset quality and voice name when language changes
  const voices = learningTargetVoices?.voices || [];
  const languageVoices = voices.filter((v) => v.language.family === language);
  const availableQualities = Array.from(new Set(languageVoices.map((v) => v.quality)));
  setSelectedQuality(availableQualities[0] || '');
}

function setSelectedQuality(quality: string) {
  selectedQuality = quality;
  // Reset voice name when quality changes
  const voices = learningTargetVoices?.voices || [];
  const qualityVoices = voices.filter(
    (v) => v.language.family === selectedLanguage && v.quality === quality
  );
  // If the current selectedVoiceName exists in qualityVoices, keep it; otherwise, set the first one
  const matchingVoice = qualityVoices.find((v) => v.name === selectedVoiceName);
  setSelectedVoiceName(matchingVoice?.name || qualityVoices[0]?.name || '');
}

function setSelectedVoiceName(voiceName: string) {
  const voices = learningTargetVoices?.voices || [];
  const voice = voices.find((v) => v.name === voiceName);
  if (voice) {
    selectedVoiceName = voiceName;
    const speakers = voice.speakers.length === 0 ? [{ id: 0, name: voice.name }] : voice.speakers;
    if (speakers.length === 1) {
      selectedSpeakerId = speakers[0].id;
    } else {
      selectedSpeakerId = 0;
    }
  }
  // Stop any playing sample
  ttsConfigStore.stopSample();
}

export const ttsConfigStore = {
  get availableVoices() {
    return availableVoices;
  },

  get learningTargetVoices() {
    return learningTargetVoices;
  },

  get isFetchingVoices() {
    return isFetchingVoices;
  },

  get selectedLanguage() {
    return selectedLanguage;
  },
  set selectedLanguage(language: string) {
    setSelectedLanguage(language);
  },

  get selectedVoiceName() {
    return selectedVoiceName;
  },
  set selectedVoiceName(voiceName: string) {
    setSelectedVoiceName(voiceName);
  },

  get selectedQuality() {
    return selectedQuality;
  },
  set selectedQuality(quality: string) {
    setSelectedQuality(quality);
  },

  get selectedSpeakerId() {
    return selectedSpeakerId.toString();
  },
  set selectedSpeakerId(id: string) {
    selectedSpeakerId = parseInt(id);
    // Stop any playing sample
    ttsConfigStore.stopSample();
  },

  get availableSpeakers() {
    return availableSpeakers;
  },

  get languageOptions() {
    return languageOptions;
  },

  get qualityOptions() {
    return qualityOptions;
  },

  get voiceOptions() {
    return voiceOptions;
  },

  get speakerOptions() {
    return speakerOptions;
  },

  get currentSpeaker() {
    return currentSpeaker;
  },

  get errorMessage() {
    return errorMessage;
  },
  set errorMessage(message: string) {
    errorMessage = message;
  },

  get isPlayingSample() {
    return isPlayingSample;
  },

  playSample(url: string) {
    if (audioElement) {
      audioElement.pause();
    }
    audioElement = new Audio(url);
    audioElement.volume = 0.8;
    audioElement.addEventListener('ended', () => {
      isPlayingSample = false;
    });
    audioElement.addEventListener('error', () => {
      errorMessage = '再生エラー';
      isPlayingSample = false;
    });
    audioElement.play();
    isPlayingSample = true;
  },

  stopSample() {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    isPlayingSample = false;
  },

  startVoicesFetching() {
    console.time('TTS voices fetched');
    isFetchingVoices = true;
    errorMessage = '';
  },

  completeVoicesFetching(availableVoicesParam: Voices, learningTargetVoicesParam: Voices) {
    availableVoices = availableVoicesParam;
    learningTargetVoices = learningTargetVoicesParam;
    selectedLanguage = learningTargetVoicesParam.voices[0]?.language.family || 'en';

    // Set default quality and voice name if not already set
    if (!selectedVoiceName && learningTargetVoicesParam.voices.length > 0) {
      const defaultLanguageVoices = learningTargetVoicesParam.voices.filter(
        (v) => v.language.family === selectedLanguage
      );
      const availableQualities = Array.from(new Set(defaultLanguageVoices.map((v) => v.quality)));
      if (!selectedQuality || !availableQualities.includes(selectedQuality)) {
        selectedQuality = availableQualities[0] || '';
      }
      const qualityVoices = defaultLanguageVoices.filter((v) => v.quality === selectedQuality);
      selectedVoiceName = qualityVoices[0]?.name || defaultLanguageVoices[0]?.name || '';
    }

    isFetchingVoices = false;

    console.timeEnd('TTS voices fetched');
  },

  failedVoicesFetching(errorMessageParam: string) {
    errorMessage = errorMessageParam;
    availableVoices = null;
    learningTargetVoices = null;
    isFetchingVoices = false;
  },

  reset() {
    availableVoices = null;
    learningTargetVoices = null;
    isFetchingVoices = false;
    selectedLanguage = 'en';
    selectedVoiceName = '';
    selectedQuality = '';
    selectedSpeakerId = 0;
    errorMessage = '';
    audioElement = null;
    isPlayingSample = false;
  },
};
