import { t } from '$lib/application/stores/i18n.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { bcp47ToTranslationKey } from '$lib/utils/language';
import { tsvConfigStore } from './tsvConfigStore.svelte';
import { ttsConfigStore } from './ttsConfigStore.svelte';

/**
 * ファイルベースのエピソード追加ペイロード
 */
export type FileEpisodeAddPayload = {
  readonly source: 'file';
  readonly title: string;
  readonly audioFilePath: string;
  readonly scriptFilePath: string;
  readonly learningLanguage: string;
  readonly tsvConfig?: TsvConfig;
};

let title = $state('');
let audioFilePath = $state<string | null>(null);
let scriptFilePath = $state<string | null>(null);
let shouldGenerateAudio = $state(false);
let errorMessage = $state('');
let languageDetectionWarningMessage = $state('');
let detectedLanguage = $state<string | null>(null);
let learningTargetLanguages = $state<readonly string[]>([]);
let selectedStudyLanguage = $state<string | null>(null);

function completeLanguageDetection(
  detectedLanguageCode: string | null,
  supportedLanguages: readonly string[]
) {
  detectedLanguage = detectedLanguageCode;
  learningTargetLanguages = supportedLanguages;
  if (detectedLanguageCode === null) {
    selectedStudyLanguage = supportedLanguages.length > 0 ? supportedLanguages[0] : null;
    languageDetectionWarningMessage = t('components.fileEpisodeForm.noLanguageDetected');
  } else if (supportedLanguages.includes(detectedLanguageCode)) {
    selectedStudyLanguage = detectedLanguageCode;
    languageDetectionWarningMessage = '';
  } else {
    selectedStudyLanguage = supportedLanguages.length > 0 ? supportedLanguages[0] : null;
    languageDetectionWarningMessage = t('components.fileEpisodeForm.languageNotTargeted', {
      language: t(bcp47ToTranslationKey(detectedLanguageCode) || detectedLanguageCode),
    });
  }
  errorMessage = '';
}

function failedLanguageDetection(errorKey: string, supportedLanguages: readonly string[]) {
  detectedLanguage = null;
  errorMessage = t(errorKey);
  learningTargetLanguages = supportedLanguages;
}

function buildPayload(): FileEpisodeAddPayload | null {
  if (!title.trim() || !audioFilePath || !scriptFilePath || !selectedStudyLanguage) {
    return null;
  }

  const tsvConfig = tsvConfigStore.tsvConfig;
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
    title: title.trim(),
    audioFilePath: audioFilePath,
    scriptFilePath: scriptFilePath,
    learningLanguage: selectedStudyLanguage,
    tsvConfig: finalTsvConfig,
  };

  return payload;
}

function reset() {
  title = '';
  audioFilePath = null;
  scriptFilePath = null;
  shouldGenerateAudio = false;
  languageDetectionWarningMessage = '';
  errorMessage = '';
  detectedLanguage = null;
  selectedStudyLanguage = null;
  learningTargetLanguages = [];
  tsvConfigStore.reset();
  ttsConfigStore.reset();
}

export const fileEpisodeAddStore = {
  get title() {
    return title;
  },
  set title(value: string) {
    title = value;
  },

  get languageDetectionWarningMessage() {
    return languageDetectionWarningMessage;
  },

  get errorMessage() {
    return errorMessage;
  },
  set errorMessage(value: string) {
    errorMessage = value;
  },

  get detectedLanguage() {
    return detectedLanguage;
  },

  get learningTargetLanguages() {
    return learningTargetLanguages;
  },

  get selectedStudyLanguage() {
    return selectedStudyLanguage;
  },
  set selectedStudyLanguage(value: string | null) {
    selectedStudyLanguage = value;
  },

  get shouldGenerateAudio() {
    return shouldGenerateAudio;
  },
  set shouldGenerateAudio(value: boolean) {
    shouldGenerateAudio = value;
  },

  get audioFilePath() {
    return audioFilePath;
  },
  set audioFilePath(path: string | null) {
    audioFilePath = path;
  },

  get scriptFilePath() {
    return scriptFilePath;
  },
  set scriptFilePath(path: string | null) {
    scriptFilePath = path;
  },

  // methods
  completeLanguageDetection,
  failedLanguageDetection,
  buildPayload,
  reset,

  // Sub stores
  tsv: tsvConfigStore,
  tts: ttsConfigStore,
};
