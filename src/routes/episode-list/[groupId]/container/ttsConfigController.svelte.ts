import { t } from '$lib/application/stores/i18n.svelte';
import type { DefaultVoices, Speaker, Voice } from '$lib/domain/entities/voice';

export type TtsConfigController = {
  readonly allVoices: readonly Voice[] | null;
  readonly learningTargetVoices: readonly Voice[] | null;
  readonly isFetchingVoices: boolean;
  readonly language: string | null;
  selectedVoiceName: string;
  readonly selectedVoice: Voice | null;
  selectedQuality: string;
  selectedSpeakerId: string;
  readonly sampleUrl: string | null;
  readonly errorMessage: string;
  startVoicesFetching: () => void;
  setVoiceData: (params: {
    allVoices: readonly Voice[];
    learningTargetVoices: readonly Voice[];
    defaultVoices: DefaultVoices;
  }) => void;
  setError: (errorMessageKey: string) => void;
  setLanguage: (lang: string | null) => void;
  reset: () => void;
};

function resolveSpeakers(voice: Voice): readonly Speaker[] {
  return voice.speakers.length === 0
    ? [{ id: 0, name: voice.name, sampleUrl: '' }]
    : voice.speakers;
}

function chooseVoiceAndSpeaker(
  qualityVoices: readonly Voice[],
  preferName?: string,
  preferSpeaker?: number
): { voiceName: string; speakerId: number } {
  const chosenVoice =
    (preferName && qualityVoices.find((v) => v.name === preferName)) || qualityVoices[0];
  const speakers = chosenVoice ? resolveSpeakers(chosenVoice) : [];

  if (preferSpeaker !== undefined && speakers.some((s) => s.id === preferSpeaker)) {
    return { voiceName: chosenVoice?.name || '', speakerId: preferSpeaker };
  } else if (speakers.length === 1) {
    return { voiceName: chosenVoice?.name || '', speakerId: speakers[0].id };
  }
  return { voiceName: chosenVoice?.name || '', speakerId: speakers[0]?.id || 0 };
}

export function createTtsConfigController(): TtsConfigController {
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

  function applyVoiceConfig(config: { quality: string; voiceName: string; speakerId: number }) {
    selectedQuality = config.quality;
    selectedVoiceName = config.voiceName;
    setSelectedSpeakerId(config.speakerId);
  }

  function selectDefaultVoiceConfig(lang: string) {
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

  function setSelectedQuality(quality: string) {
    selectedQuality = quality;
    const qualityVoices = selectedLanguageQualityVoices;
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

  return {
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
}
