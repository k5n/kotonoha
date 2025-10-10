import { t } from '$lib/application/stores/i18n.svelte';
import type { DefaultVoices, Voice, Voices } from '$lib/domain/entities/voice';
import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';

let availableVoices = $state(null as Voices | null);
let learningTargetVoices = $state(null as Voices | null);
let defaultVoices = $state({} as DefaultVoices);
let isFetchingVoices = $state(false);
let selectedLanguage = $state('en');
let selectedQuality = $state('');
let selectedVoiceName = $state('');
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

const availableQualities = $derived.by(() => {
  const voices = learningTargetVoices?.voices || [];
  const languageVoices = voices.filter((v) => v.language.family === selectedLanguage);
  return Array.from(new Set(languageVoices.map((v) => v.quality)));
});

const qualityOptions = $derived(
  availableQualities.map((quality) => ({ value: quality, name: quality }))
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

// Helper types for voice configuration
type VoiceConfig = {
  readonly quality: string;
  readonly voiceName: string;
  readonly speakerId: number;
};

// Pure helper functions for voice selection logic
function resolveSpeakers(voice: Voice) {
  return voice.speakers.length === 0 ? [{ id: 0, name: voice.name }] : voice.speakers;
}

function chooseVoiceAndSpeaker(
  qualityVoices: readonly Voice[],
  preferName?: string,
  preferSpeaker?: number
): { voiceName: string; speakerId: number } {
  const chosenVoice =
    (preferName && qualityVoices.find((v) => v.name === preferName)) || qualityVoices[0];
  const speakers = resolveSpeakers(chosenVoice);

  if (preferSpeaker !== undefined && speakers.some((s) => s.id === preferSpeaker)) {
    return { voiceName: chosenVoice.name, speakerId: preferSpeaker };
  } else if (speakers.length === 1) {
    return { voiceName: chosenVoice.name, speakerId: speakers[0].id };
  }
  return { voiceName: chosenVoice.name, speakerId: 0 };
}

function selectDefaultVoiceConfig(language: string): VoiceConfig | null {
  const defaultForLang = defaultVoices[language];

  if (!defaultForLang || !availableQualities.includes(defaultForLang.quality)) {
    return null;
  }

  const voices = learningTargetVoices?.voices || [];
  const qualityVoices = voices.filter(
    (v) => v.language.family === language && v.quality === defaultForLang.quality
  );

  const { voiceName, speakerId } = chooseVoiceAndSpeaker(
    qualityVoices,
    defaultForLang.name,
    defaultForLang.speaker
  );

  return {
    quality: defaultForLang.quality,
    voiceName,
    speakerId,
  };
}

function applyVoiceConfig(config: VoiceConfig) {
  selectedQuality = config.quality;
  selectedVoiceName = config.voiceName;
  setSelectedSpeakerId(config.speakerId);
}

function setSelectedLanguage(language: string) {
  selectedLanguage = language;

  const config = selectDefaultVoiceConfig(language);

  if (config) {
    applyVoiceConfig(config);
  } else {
    // デフォルト設定がない場合は、最初の品質でsetSelectedQualityを呼ぶ
    setSelectedQuality(availableQualities[0] || '');
  }
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
    const speakers = resolveSpeakers(voice);
    if (speakers.length === 1) {
      setSelectedSpeakerId(speakers[0].id);
    } else {
      setSelectedSpeakerId(0);
    }
  }
}

function setSelectedSpeakerId(id: number) {
  selectedSpeakerId = id;
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
    setSelectedSpeakerId(parseInt(id));
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

  completeVoicesFetching(
    availableVoicesParam: Voices,
    learningTargetVoicesParam: Voices,
    defaultVoicesParam: DefaultVoices
  ) {
    availableVoices = availableVoicesParam;
    learningTargetVoices = learningTargetVoicesParam;
    defaultVoices = defaultVoicesParam;
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
