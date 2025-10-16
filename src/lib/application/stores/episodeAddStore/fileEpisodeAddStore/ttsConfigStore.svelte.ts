import { t } from '$lib/application/stores/i18n.svelte';
import type { DefaultVoices, Speaker, Voice, Voices } from '$lib/domain/entities/voice';
import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';

let fetchedParams = $state({
  allVoices: null as Voices | null,
  learningTargetVoices: null as Voices | null,
  defaultVoices: {} as DefaultVoices,
  detectedLanguage: null as string | null,
  isFetchingVoices: false,
});
let selectedLanguage = $state('en');
let selectedQuality = $state('');
let selectedVoiceName = $state('');
let selectedSpeakerId = $state(0);
let errorMessage = $state('');
let warningMessage = $state('');
let audioElement = $state(null as HTMLAudioElement | null);
let isPlayingSample = $state(false);

const languageOptions = $derived(
  fetchedParams.learningTargetVoices?.voices
    .map((voice) => voice.language)
    .filter((lang, index, self) => self.findIndex((l) => l.family === lang.family) === index)
    .map((lang) => ({
      value: lang.family,
      name: `${t(bcp47ToTranslationKey(lang.family)!)} (${bcp47ToLanguageName(lang.family)})`,
    })) || []
);

const selectedLanguageVoices = $derived(
  fetchedParams.learningTargetVoices?.voices.filter(
    (voice) => voice.language.family === selectedLanguage
  ) || []
);

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

const currentVoice = $derived(
  selectedLanguageQualityVoices.find((voice) => voice.name === selectedVoiceName) || null
);

const availableSpeakers = $derived(currentVoice ? resolveSpeakers(currentVoice) : []);

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
function resolveSpeakers(voice: Voice): readonly Speaker[] {
  return voice.speakers.length === 0
    ? [{ id: 0, name: voice.name, sampleUrl: '' }]
    : voice.speakers;
}

/**
 * Choose a voice and speaker based on preferences and available options
 * @param qualityVoices Voices filtered by selected quality and language
 * @param preferName Preferred voice name (optional)
 * @param preferSpeaker Preferred speaker ID (optional)
 * @returns Selected voice name and speaker ID
 */
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

/**
 * Select default voice configuration based on language and available voices
 * @param language BCP-47 language primary code
 * @returns VoiceConfig or null if no suitable default found
 */
function selectDefaultVoiceConfig(language: string): VoiceConfig | null {
  const defaultForLang = fetchedParams.defaultVoices[language];

  if (!defaultForLang || !availableQualities.includes(defaultForLang.quality)) {
    return null;
  }

  const voices = fetchedParams.learningTargetVoices?.voices || [];
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
  const qualityVoices = selectedLanguageQualityVoices;
  // If the current selectedVoiceName exists in qualityVoices, keep it; otherwise, set the first one
  const matchingVoice = qualityVoices.find((v) => v.name === selectedVoiceName);
  setSelectedVoiceName(matchingVoice?.name || qualityVoices[0]?.name || '');
}

function setSelectedVoiceName(voiceName: string) {
  selectedVoiceName = voiceName;
  const speakers = availableSpeakers;
  if (speakers.length === 1) {
    setSelectedSpeakerId(speakers[0].id);
  } else {
    setSelectedSpeakerId(0);
  }
}

function setSelectedSpeakerId(id: number) {
  selectedSpeakerId = id;
  // Stop any playing sample
  ttsConfigStore.stopSample();
}

function resetFetchedParams() {
  fetchedParams = {
    allVoices: null,
    learningTargetVoices: null,
    defaultVoices: {},
    detectedLanguage: null,
    isFetchingVoices: false,
  };
}

export const ttsConfigStore = {
  get allVoices() {
    return fetchedParams.allVoices;
  },

  get learningTargetVoices() {
    return fetchedParams.learningTargetVoices;
  },

  get isFetchingVoices() {
    return fetchedParams.isFetchingVoices;
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

  get selectedVoice() {
    return currentVoice;
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

  get sampleUrl() {
    return currentSpeaker?.sampleUrl || null;
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

  get errorMessage() {
    return errorMessage;
  },

  get warningMessage() {
    return warningMessage;
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
      errorMessage = t('components.ttsConfigSection.playbackError');
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
    fetchedParams.isFetchingVoices = true;
    errorMessage = '';
    warningMessage = '';
  },

  completeVoicesFetching({
    allVoices,
    learningTargetVoices,
    defaultVoices,
    detectedLanguage,
  }: {
    allVoices: Voices;
    learningTargetVoices: Voices;
    defaultVoices: DefaultVoices;
    detectedLanguage: string | null;
  }) {
    // Check if detected language exists in learning target voices
    const availableLanguages = allVoices.voices.map((voice) => voice.language.family);
    const learningTargetLanguages = learningTargetVoices.voices.map(
      (voice) => voice.language.family
    );
    const fallbackLanguage = learningTargetVoices.voices[0]?.language.family;
    if (fallbackLanguage === undefined) {
      errorMessage = t('components.ttsConfigSection.noVoices');
      resetFetchedParams();
      return;
    }

    fetchedParams = {
      allVoices,
      learningTargetVoices,
      defaultVoices,
      detectedLanguage,
      isFetchingVoices: false,
    };

    if (!detectedLanguage) {
      setSelectedLanguage(fallbackLanguage);
      return;
    }

    if (learningTargetLanguages.includes(detectedLanguage)) {
      setSelectedLanguage(detectedLanguage);
      return;
    }

    setSelectedLanguage(fallbackLanguage);
    const translationKey = bcp47ToTranslationKey(detectedLanguage);
    const detectedLanguageName = translationKey
      ? t(translationKey)
      : bcp47ToLanguageName(detectedLanguage) || detectedLanguage;

    if (availableLanguages.includes(detectedLanguage)) {
      warningMessage = t('components.ttsConfigSection.languageNotInTargets', {
        detectedLanguage: detectedLanguageName,
      });
    } else {
      setSelectedLanguage(fallbackLanguage);
      warningMessage = t('components.ttsConfigSection.languageNotSupported', {
        detectedLanguage: detectedLanguageName,
      });
    }
  },

  failedVoicesFetching(errorMessageKey: string) {
    errorMessage = t(errorMessageKey);
    resetFetchedParams();
  },

  reset() {
    resetFetchedParams();
    selectedLanguage = 'en';
    selectedVoiceName = '';
    selectedQuality = '';
    selectedSpeakerId = 0;
    errorMessage = '';
    warningMessage = '';
    audioElement = null;
    isPlayingSample = false;
  },
};
