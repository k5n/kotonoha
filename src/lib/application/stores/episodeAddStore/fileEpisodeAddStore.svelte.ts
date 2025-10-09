import { t } from '$lib/application/stores/i18n.svelte';
import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import type { Voices } from '$lib/domain/entities/voice';

/**
 * ファイルベースのエピソード追加ペイロード
 */
export type FileEpisodeAddPayload = {
  readonly source: 'file';
  readonly title: string;
  readonly audioFilePath: string;
  readonly scriptFilePath: string;
  readonly tsvConfig?: TsvConfig;
  readonly ttsLanguage?: string;
  readonly ttsVoiceName?: string;
  readonly ttsQuality?: string;
};

const store = $state({
  title: '',
  audioFilePath: null as string | null,
  scriptFilePath: null as string | null,
  shouldGenerateAudio: false,
  tsvConfig: {
    startTimeColumnIndex: -1,
    textColumnIndex: -1,
    endTimeColumnIndex: -1,
  } as TsvConfig,
  isFetchingScriptPreview: false,
  scriptPreview: null as ScriptPreview | null,
  errorMessage: '',

  // TTS section state
  ttsSection: {
    availableVoices: null as Voices | null,
    isFetchingVoices: false,
    selectedLanguage: 'en',
    selectedVoiceName: '',
    selectedQuality: '',
    errorMessage: '',
  },
});

export const fileEpisodeAddStore = {
  get title() {
    return store.title;
  },
  set title(title: string) {
    store.title = title;
  },

  get tsvConfig() {
    return store.tsvConfig;
  },

  get errorMessage() {
    return store.errorMessage;
  },

  get scriptPreview() {
    return store.scriptPreview;
  },

  get isFetchingScriptPreview() {
    return store.isFetchingScriptPreview;
  },

  get shouldGenerateAudio() {
    return store.shouldGenerateAudio;
  },
  set shouldGenerateAudio(value: boolean) {
    store.shouldGenerateAudio = value;
  },

  get hasOnlyScriptFile() {
    return !!store.scriptFilePath && !store.audioFilePath;
  },

  get isTxtScriptFile() {
    return store.scriptFilePath?.toLowerCase().endsWith('.txt') ?? false;
  },

  get ttsAvailableVoices() {
    return store.ttsSection.availableVoices;
  },

  get isFetchingTtsVoices() {
    return store.ttsSection.isFetchingVoices;
  },

  get ttsSelectedLanguage() {
    return store.ttsSection.selectedLanguage;
  },
  set ttsSelectedLanguage(language: string) {
    store.ttsSection.selectedLanguage = language;
    // Reset quality and voice name when language changes
    const voices = store.ttsSection.availableVoices?.voices || [];
    const languageVoices = voices.filter((v) => v.language.family === language);
    const availableQualities = Array.from(new Set(languageVoices.map((v) => v.quality)));
    store.ttsSection.selectedQuality = availableQualities[0];
    const qualityVoices = languageVoices.filter(
      (v) => v.quality === store.ttsSection.selectedQuality
    );
    store.ttsSection.selectedVoiceName = qualityVoices[0]?.name || '';
  },

  get ttsSelectedVoiceName() {
    return store.ttsSection.selectedVoiceName;
  },
  set ttsSelectedVoiceName(voiceName: string) {
    store.ttsSection.selectedVoiceName = voiceName;
  },

  get ttsSelectedQuality() {
    return store.ttsSection.selectedQuality;
  },
  set ttsSelectedQuality(quality: string) {
    store.ttsSection.selectedQuality = quality;
    // Reset voice name when quality changes
    const voices = store.ttsSection.availableVoices?.voices || [];
    const qualityVoices = voices.filter(
      (v) => v.language.family === store.ttsSection.selectedLanguage && v.quality === quality
    );
    store.ttsSection.selectedVoiceName = qualityVoices[0]?.name || '';
  },

  get ttsErrorMessage() {
    return store.ttsSection.errorMessage;
  },
  set ttsErrorMessage(message: string) {
    store.ttsSection.errorMessage = message;
  },

  setAudioFilePath(path: string | null) {
    store.audioFilePath = path;
  },

  setScriptFilePath(path: string | null) {
    store.scriptFilePath = path;
  },

  updateConfig(field: keyof TsvConfig, value: number) {
    store.tsvConfig = {
      ...store.tsvConfig,
      [field]: value,
    };
  },

  startScriptPreviewFetching() {
    store.isFetchingScriptPreview = true;
    store.errorMessage = '';
  },

  completeScriptPreviewFetching(preview: ScriptPreview | null) {
    store.scriptPreview = preview;
    store.isFetchingScriptPreview = false;
  },

  failedScriptPreviewFetching(errorMessage: string) {
    store.errorMessage = errorMessage;
    store.scriptPreview = null;
    store.isFetchingScriptPreview = false;
  },

  startTtsVoicesFetching() {
    store.ttsSection.isFetchingVoices = true;
    store.ttsSection.errorMessage = '';
  },

  completeTtsVoicesFetching(voices: Voices) {
    store.ttsSection.availableVoices = voices;
    store.ttsSection.isFetchingVoices = false;

    // Set default quality and voice name if not already set
    if (!store.ttsSection.selectedVoiceName && voices.voices.length > 0) {
      const defaultLanguageVoices = voices.voices.filter(
        (v) => v.language.family === store.ttsSection.selectedLanguage
      );
      const availableQualities = Array.from(new Set(defaultLanguageVoices.map((v) => v.quality)));
      if (
        !store.ttsSection.selectedQuality ||
        !availableQualities.includes(store.ttsSection.selectedQuality)
      ) {
        store.ttsSection.selectedQuality = availableQualities[0];
      }
      const qualityVoices = defaultLanguageVoices.filter(
        (v) => v.quality === store.ttsSection.selectedQuality
      );
      store.ttsSection.selectedVoiceName =
        qualityVoices[0]?.name || defaultLanguageVoices[0]?.name || '';
    }
  },

  failedTtsVoicesFetching(errorMessage: string) {
    store.ttsSection.errorMessage = errorMessage;
    store.ttsSection.availableVoices = null;
    store.ttsSection.isFetchingVoices = false;
  },

  validate(): boolean {
    const title = store.title.trim();
    const audioFilePath = store.audioFilePath;
    const scriptFilePath = store.scriptFilePath;
    const scriptPreview = store.scriptPreview;
    const tsvConfig = store.tsvConfig;
    if (!title.trim()) {
      store.errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return false;
    }
    if (!audioFilePath && !store.shouldGenerateAudio) {
      store.errorMessage = t('components.episodeAddModal.errorAudioFileRequired');
      return false;
    }
    if (!scriptFilePath) {
      store.errorMessage = t('components.episodeAddModal.errorScriptFileRequired');
      return false;
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        store.errorMessage = t('components.episodeAddModal.errorTsvColumnRequired');
        return false;
      }
    }
    return true;
  },

  buildPayload(): FileEpisodeAddPayload | null {
    if (!store.title.trim() || !store.audioFilePath || !store.scriptFilePath) {
      return null;
    }

    const tsvConfig = store.tsvConfig;
    const finalTsvConfig =
      tsvConfig.startTimeColumnIndex !== -1 && tsvConfig.textColumnIndex !== -1
        ? {
            startTimeColumnIndex: tsvConfig.startTimeColumnIndex,
            textColumnIndex: tsvConfig.textColumnIndex,
            ...(tsvConfig.endTimeColumnIndex !== -1 && {
              endTimeColumnIndex: tsvConfig.endTimeColumnIndex,
            }),
          }
        : undefined;

    const payload: FileEpisodeAddPayload = {
      source: 'file',
      title: store.title.trim(),
      audioFilePath: store.audioFilePath,
      scriptFilePath: store.scriptFilePath,
      tsvConfig: finalTsvConfig,
    };

    // Add TTS configuration if audio generation is enabled
    if (store.shouldGenerateAudio) {
      return {
        ...payload,
        ttsLanguage: store.ttsSection.selectedLanguage,
        ttsVoiceName: store.ttsSection.selectedVoiceName || undefined,
        ttsQuality: store.ttsSection.selectedQuality,
      };
    }

    return payload;
  },

  reset() {
    store.title = '';
    store.audioFilePath = null;
    store.scriptFilePath = null;
    store.shouldGenerateAudio = false;
    store.tsvConfig = {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    };
    store.scriptPreview = null;
    store.isFetchingScriptPreview = false;
    store.errorMessage = '';
    store.ttsSection = {
      availableVoices: null,
      isFetchingVoices: false,
      selectedLanguage: 'en',
      selectedVoiceName: '',
      selectedQuality: 'medium',
      errorMessage: '',
    };
  },
};
