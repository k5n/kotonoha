import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import type { Voices } from '$lib/domain/entities/voice';
import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';

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

/**
 * YouTubeベースのエピソード追加ペイロード
 */
export type YoutubeEpisodeAddPayload = {
  readonly source: 'youtube';
  readonly youtubeMetadata: YoutubeMetadata;
  readonly youtubeUrl: string;
};

/**
 * エピソード追加ペイロードのユニオン型
 */
export type EpisodeAddPayload = FileEpisodeAddPayload | YoutubeEpisodeAddPayload;

const store = $state({
  // Modal state
  show: false,
  isSubmitting: false,

  // Form type
  sourceType: 'file' as 'file' | 'youtube',

  // File form state
  fileForm: {
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
  },

  // TTS form state
  ttsForm: {
    availableVoices: null as Voices | null,
    isFetchingVoices: false,
    selectedLanguage: 'en',
    selectedVoiceName: '',
    selectedQuality: 'high',
    errorMessage: '',
  },

  // YouTube form state
  youtubeForm: {
    url: '',
    metadata: null as YoutubeMetadata | null,
    isFetching: false,
    errorMessage: '',
  },
});

// Reset all form state
function reset() {
  store.sourceType = 'file';
  store.isSubmitting = false;
  store.fileForm = {
    title: '',
    audioFilePath: null,
    scriptFilePath: null,
    shouldGenerateAudio: false,
    tsvConfig: {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    },
    scriptPreview: null,
    isFetchingScriptPreview: false,
    errorMessage: '',
  };
  store.youtubeForm = {
    url: '',
    metadata: null,
    isFetching: false,
    errorMessage: '',
  };
  store.ttsForm = {
    availableVoices: null,
    isFetchingVoices: false,
    selectedLanguage: 'en',
    selectedVoiceName: '',
    selectedQuality: 'medium',
    errorMessage: '',
  };
}

function buildFilePayload(): EpisodeAddPayload | null {
  if (
    !store.fileForm.title.trim() ||
    !store.fileForm.audioFilePath ||
    !store.fileForm.scriptFilePath
  ) {
    return null;
  }

  const tsvConfig = store.fileForm.tsvConfig;
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
    title: store.fileForm.title.trim(),
    audioFilePath: store.fileForm.audioFilePath,
    scriptFilePath: store.fileForm.scriptFilePath,
    tsvConfig: finalTsvConfig,
  };

  // Add TTS configuration if audio generation is enabled
  if (store.fileForm.shouldGenerateAudio) {
    return {
      ...payload,
      ttsLanguage: store.ttsForm.selectedLanguage,
      ttsVoiceName: store.ttsForm.selectedVoiceName || undefined,
      ttsQuality: store.ttsForm.selectedQuality,
    };
  }

  return payload;
}

function buildYoutubePayload(): EpisodeAddPayload | null {
  if (!store.youtubeForm.url.trim() || !store.youtubeForm.metadata) {
    return null;
  }

  return {
    source: 'youtube',
    youtubeMetadata: store.youtubeForm.metadata,
    youtubeUrl: store.youtubeForm.url,
  };
}

export const episodeAddStore = {
  // Modal state getters
  get show() {
    return store.show;
  },
  get isSubmitting() {
    return store.isSubmitting;
  },

  // Form type property
  get sourceType() {
    return store.sourceType;
  },
  set sourceType(type: 'file' | 'youtube') {
    store.sourceType = type;
  },

  // File form properties
  get fileTitle() {
    return store.fileForm.title;
  },
  set fileTitle(title: string) {
    store.fileForm.title = title;
  },
  get tsvConfig() {
    return store.fileForm.tsvConfig;
  },
  get fileFormErrorMessage() {
    return store.fileForm.errorMessage;
  },
  set fileFormErrorMessage(message: string) {
    store.fileForm.errorMessage = message;
  },
  get scriptPreview() {
    return store.fileForm.scriptPreview;
  },
  get isFetchingScriptPreview() {
    return store.fileForm.isFetchingScriptPreview;
  },
  get shouldGenerateAudio() {
    return store.fileForm.shouldGenerateAudio;
  },
  set shouldGenerateAudio(value: boolean) {
    store.fileForm.shouldGenerateAudio = value;
  },
  get hasOnlyScriptFile() {
    return !!store.fileForm.scriptFilePath && !store.fileForm.audioFilePath;
  },
  get isTxtScriptFile() {
    return store.fileForm.scriptFilePath?.toLowerCase().endsWith('.txt') ?? false;
  },

  // YouTube form getters
  get youtubeUrl() {
    return store.youtubeForm.url;
  },
  set youtubeUrl(url: string) {
    store.youtubeForm.url = url;
    // Clear metadata and error when URL changes
    if (!url.trim()) {
      store.youtubeForm.metadata = null;
      store.youtubeForm.errorMessage = '';
    }
  },
  get youtubeMetadata() {
    return store.youtubeForm.metadata;
  },
  get isYoutubeMetadataFetching() {
    return store.youtubeForm.isFetching;
  },
  get youtubeErrorMessage() {
    return store.youtubeForm.errorMessage;
  },
  set youtubeErrorMessage(message: string) {
    store.youtubeForm.errorMessage = message;
  },

  // TTS form getters and setters
  get ttsAvailableVoices() {
    return store.ttsForm.availableVoices;
  },
  get isFetchingTtsVoices() {
    return store.ttsForm.isFetchingVoices;
  },
  get ttsSelectedLanguage() {
    return store.ttsForm.selectedLanguage;
  },
  set ttsSelectedLanguage(language: string) {
    store.ttsForm.selectedLanguage = language;
    // Reset quality and voice name when language changes
    const voices = store.ttsForm.availableVoices?.voices || [];
    const languageVoices = voices.filter((v) => v.language.family === language);
    const availableQualities = Array.from(new Set(languageVoices.map((v) => v.quality)));
    store.ttsForm.selectedQuality = availableQualities[0];
    const qualityVoices = languageVoices.filter((v) => v.quality === store.ttsForm.selectedQuality);
    store.ttsForm.selectedVoiceName = qualityVoices[0]?.name || '';
  },
  get ttsSelectedVoiceName() {
    return store.ttsForm.selectedVoiceName;
  },
  set ttsSelectedVoiceName(voiceName: string) {
    store.ttsForm.selectedVoiceName = voiceName;
  },
  get ttsSelectedQuality() {
    return store.ttsForm.selectedQuality;
  },
  set ttsSelectedQuality(quality: string) {
    store.ttsForm.selectedQuality = quality;
    // Reset voice name when quality changes
    const voices = store.ttsForm.availableVoices?.voices || [];
    const qualityVoices = voices.filter(
      (v) => v.language.family === store.ttsForm.selectedLanguage && v.quality === quality
    );
    store.ttsForm.selectedVoiceName = qualityVoices[0]?.name || '';
  },
  get ttsErrorMessage() {
    return store.ttsForm.errorMessage;
  },
  set ttsErrorMessage(message: string) {
    store.ttsForm.errorMessage = message;
  },

  // Modal actions
  open() {
    store.show = true;
  },

  close() {
    reset();
    store.show = false;
  },

  startSubmitting() {
    store.isSubmitting = true;
  },

  // File form actions
  setAudioFilePath(path: string | null) {
    store.fileForm.audioFilePath = path;
  },

  setScriptFilePath(path: string | null) {
    store.fileForm.scriptFilePath = path;
  },

  updateConfig(field: keyof TsvConfig, value: number) {
    store.fileForm.tsvConfig = {
      ...store.fileForm.tsvConfig,
      [field]: value,
    };
  },

  startScriptPreviewFetching() {
    store.fileForm.isFetchingScriptPreview = true;
    store.fileForm.errorMessage = '';
  },

  completeScriptPreviewFetching(preview: ScriptPreview | null) {
    store.fileForm.scriptPreview = preview;
    store.fileForm.isFetchingScriptPreview = false;
  },

  failedScriptPreviewFetching(errorMessage: string) {
    store.fileForm.errorMessage = errorMessage;
    store.fileForm.scriptPreview = null;
    store.fileForm.isFetchingScriptPreview = false;
  },

  // YouTube form actions
  changeYoutubeTitle(title: string) {
    if (store.youtubeForm.metadata) {
      store.youtubeForm.metadata = {
        ...store.youtubeForm.metadata,
        title: title,
      };
    }
  },

  startYoutubeMetadataFetching() {
    store.youtubeForm.isFetching = true;
    store.youtubeForm.errorMessage = '';
  },

  completeYoutubeMetadataFetching(metadata: YoutubeMetadata | null) {
    store.youtubeForm.metadata = metadata;
    store.youtubeForm.isFetching = false;
  },

  failedYoutubeMetadataFetching(errorMessage: string) {
    store.youtubeForm.errorMessage = errorMessage;
    store.youtubeForm.metadata = null;
    store.youtubeForm.isFetching = false;
  },

  // TTS form actions
  startTtsVoicesFetching() {
    store.ttsForm.isFetchingVoices = true;
    store.ttsForm.errorMessage = '';
  },

  completeTtsVoicesFetching(voices: Voices) {
    store.ttsForm.availableVoices = voices;
    store.ttsForm.isFetchingVoices = false;

    // Set default quality and voice name if not already set
    if (!store.ttsForm.selectedVoiceName && voices.voices.length > 0) {
      const defaultLanguageVoices = voices.voices.filter(
        (v) => v.language.family === store.ttsForm.selectedLanguage
      );
      const availableQualities = Array.from(new Set(defaultLanguageVoices.map((v) => v.quality)));
      if (
        !store.ttsForm.selectedQuality ||
        !availableQualities.includes(store.ttsForm.selectedQuality)
      ) {
        store.ttsForm.selectedQuality = availableQualities[0] || 'high';
      }
      const qualityVoices = defaultLanguageVoices.filter(
        (v) => v.quality === store.ttsForm.selectedQuality
      );
      store.ttsForm.selectedVoiceName =
        qualityVoices[0]?.name || defaultLanguageVoices[0]?.name || '';
    }
  },

  failedTtsVoicesFetching(errorMessage: string) {
    store.ttsForm.errorMessage = errorMessage;
    store.ttsForm.availableVoices = null;
    store.ttsForm.isFetchingVoices = false;
  },

  validateFileForm(): string {
    const title = store.fileForm.title.trim();
    const audioFilePath = store.fileForm.audioFilePath;
    const scriptFilePath = store.fileForm.scriptFilePath;
    const scriptPreview = store.fileForm.scriptPreview;
    const tsvConfig = store.fileForm.tsvConfig;
    if (!title.trim()) {
      return 'components.episodeAddModal.errorTitleRequired';
    }
    if (!audioFilePath && !store.fileForm.shouldGenerateAudio) {
      return 'components.episodeAddModal.errorAudioFileRequired';
    }
    if (!scriptFilePath) {
      return 'components.episodeAddModal.errorScriptFileRequired';
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        return 'components.episodeAddModal.errorTsvColumnRequired';
      }
    }
    return '';
  },

  validateYoutubeForm(): string {
    const title = store.youtubeForm.metadata?.title?.trim() || '';
    const url = store.youtubeForm.url.trim();
    if (!title) {
      return 'components.episodeAddModal.errorTitleRequired';
    }
    if (!url) {
      return 'components.episodeAddModal.errorYoutubeUrlRequired';
    }
    return '';
  },

  // Build payload for submission
  buildPayload(): EpisodeAddPayload | null {
    if (store.sourceType === 'file') {
      return buildFilePayload();
    } else if (store.sourceType === 'youtube') {
      return buildYoutubePayload();
    }
    return null;
  },
};
