import type { Voices } from '$lib/domain/entities/voice';

const store = $state({
  availableVoices: null as Voices | null,
  isFetchingVoices: false,
  selectedLanguage: 'en',
  selectedVoiceName: '',
  selectedQuality: '',
  errorMessage: '',
});

export const ttsConfigStore = {
  get availableVoices() {
    return store.availableVoices;
  },

  get isFetchingVoices() {
    return store.isFetchingVoices;
  },

  get selectedLanguage() {
    return store.selectedLanguage;
  },
  set selectedLanguage(language: string) {
    store.selectedLanguage = language;
    // Reset quality and voice name when language changes
    const voices = store.availableVoices?.voices || [];
    const languageVoices = voices.filter((v) => v.language.family === language);
    const availableQualities = Array.from(new Set(languageVoices.map((v) => v.quality)));
    store.selectedQuality = availableQualities[0] || '';
    const qualityVoices = languageVoices.filter((v) => v.quality === store.selectedQuality);
    store.selectedVoiceName = qualityVoices[0]?.name || '';
  },

  get selectedVoiceName() {
    return store.selectedVoiceName;
  },
  set selectedVoiceName(voiceName: string) {
    store.selectedVoiceName = voiceName;
  },

  get selectedQuality() {
    return store.selectedQuality;
  },
  set selectedQuality(quality: string) {
    store.selectedQuality = quality;
    // Reset voice name when quality changes
    const voices = store.availableVoices?.voices || [];
    const qualityVoices = voices.filter(
      (v) => v.language.family === store.selectedLanguage && v.quality === quality
    );
    store.selectedVoiceName = qualityVoices[0]?.name || '';
  },

  get errorMessage() {
    return store.errorMessage;
  },
  set errorMessage(message: string) {
    store.errorMessage = message;
  },

  startVoicesFetching() {
    store.isFetchingVoices = true;
    store.errorMessage = '';
  },

  completeVoicesFetching(voices: Voices) {
    store.availableVoices = voices;
    store.isFetchingVoices = false;

    // Set default quality and voice name if not already set
    if (!store.selectedVoiceName && voices.voices.length > 0) {
      const defaultLanguageVoices = voices.voices.filter(
        (v) => v.language.family === store.selectedLanguage
      );
      const availableQualities = Array.from(new Set(defaultLanguageVoices.map((v) => v.quality)));
      if (!store.selectedQuality || !availableQualities.includes(store.selectedQuality)) {
        store.selectedQuality = availableQualities[0] || '';
      }
      const qualityVoices = defaultLanguageVoices.filter(
        (v) => v.quality === store.selectedQuality
      );
      store.selectedVoiceName = qualityVoices[0]?.name || defaultLanguageVoices[0]?.name || '';
    }
  },

  failedVoicesFetching(errorMessage: string) {
    store.errorMessage = errorMessage;
    store.availableVoices = null;
    store.isFetchingVoices = false;
  },

  reset() {
    store.availableVoices = null;
    store.isFetchingVoices = false;
    store.selectedLanguage = 'en';
    store.selectedVoiceName = '';
    store.selectedQuality = '';
    store.errorMessage = '';
  },
};
