import { t } from '$lib/application/stores/i18n.svelte';
import type { DefaultVoices, Speaker, Voice } from '$lib/domain/entities/voice';

let fetchedParams = $state({
  allVoices: null as readonly Voice[] | null,
  learningTargetVoices: null as readonly Voice[] | null,
  defaultVoices: {} as DefaultVoices,
  isFetchingVoices: false,
});
let language = $state<string | null>(null);
let selectedQuality = $state('');
let selectedVoiceName = $state('');
let selectedSpeakerId = $state(0);
let errorMessage = $state('');

const selectedLanguageVoices = $derived(
  fetchedParams.learningTargetVoices?.filter((voice) => voice.language.family === language) || []
);

const availableQualities = $derived(
  Array.from(new Set(selectedLanguageVoices.map((v) => v.quality)))
);

const selectedLanguageQualityVoices = $derived(
  selectedLanguageVoices.filter((voice) => voice.quality === selectedQuality) || []
);

const currentVoice = $derived(
  selectedLanguageQualityVoices.find((voice) => voice.name === selectedVoiceName) || null
);

const availableSpeakers = $derived(currentVoice ? resolveSpeakers(currentVoice) : []);

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
 * @param lang BCP-47 language primary code
 * @returns VoiceConfig or null if no suitable default found
 */
function selectDefaultVoiceConfig(lang: string): VoiceConfig | null {
  const defaultForLang = fetchedParams.defaultVoices[lang];

  if (!defaultForLang || !availableQualities.includes(defaultForLang.quality)) {
    return null;
  }

  const voices = fetchedParams.learningTargetVoices || [];
  const qualityVoices = voices.filter(
    (v) => v.language.family === lang && v.quality === defaultForLang.quality
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
}

function setLanguage(newLanguage: string | null) {
  errorMessage = '';

  if (!newLanguage) {
    language = null;
    return;
  }

  const allTtsVoices = fetchedParams.allVoices;
  if (!allTtsVoices) {
    // Voice data not loaded yet, do nothing.
    // The language will be validated once data is available.
    return;
  }

  const supportedLangs = allTtsVoices.map((v) => v.language.family);
  if (supportedLangs.includes(newLanguage)) {
    language = newLanguage;
    const config = selectDefaultVoiceConfig(newLanguage);
    if (config) {
      applyVoiceConfig(config);
    } else {
      setSelectedQuality(availableQualities[0] || '');
    }
  } else {
    language = null;
    errorMessage = t('components.ttsConfigSection.languageNotSupported');
  }
}

function resetFetchedParams() {
  fetchedParams = {
    allVoices: null,
    learningTargetVoices: null,
    defaultVoices: {},
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

  get language() {
    return language;
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

  get errorMessage() {
    return errorMessage;
  },

  startVoicesFetching() {
    fetchedParams.isFetchingVoices = true;
    errorMessage = '';
  },

  setVoiceData({
    allVoices,
    learningTargetVoices,
    defaultVoices,
  }: {
    allVoices: readonly Voice[];
    learningTargetVoices: readonly Voice[];
    defaultVoices: DefaultVoices;
  }) {
    if (learningTargetVoices.length === 0) {
      errorMessage = t('components.ttsConfigSection.noVoices');
      resetFetchedParams();
      return;
    }

    fetchedParams = {
      allVoices,
      learningTargetVoices,
      defaultVoices,
      isFetchingVoices: false,
    };
  },

  setError(errorMessageKey: string) {
    errorMessage = t(errorMessageKey);
    resetFetchedParams();
  },

  setLanguage,

  reset() {
    resetFetchedParams();
    language = null;
    selectedVoiceName = '';
    selectedQuality = '';
    selectedSpeakerId = 0;
    errorMessage = '';
  },
};
