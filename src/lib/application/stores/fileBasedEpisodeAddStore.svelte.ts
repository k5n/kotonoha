import { t } from '$lib/application/stores/i18n.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { assertNotNull } from '$lib/utils/assertion';
import { bcp47ToTranslationKey } from '$lib/utils/language';
import { ttsConfigStore } from './ttsConfigStore.svelte';

export type FileBasedEpisodeAddPayload = {
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
let errorMessage = $state('');
let languageDetectionWarningMessage = $state('');
let detectedLanguage = $state<string | null>(null);
let learningTargetLanguages = $state<readonly string[]>([]);
let selectedStudyLanguage = $state<string | null>(null);

function setSelectedStudyLanguage(language: string | null) {
  selectedStudyLanguage = language;
  ttsConfigStore.setLanguage(language);
}

function completeLanguageDetection(
  detectedLanguageCode: string | null,
  supportedLanguages: readonly string[]
) {
  detectedLanguage = detectedLanguageCode;
  learningTargetLanguages = supportedLanguages;

  if (detectedLanguageCode === null) {
    setSelectedStudyLanguage(supportedLanguages[0]);
    languageDetectionWarningMessage = t('components.fileEpisodeForm.noLanguageDetected');
  } else if (supportedLanguages.includes(detectedLanguageCode)) {
    setSelectedStudyLanguage(detectedLanguageCode);
    languageDetectionWarningMessage = '';
  } else {
    setSelectedStudyLanguage(supportedLanguages[0]);
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
  setSelectedStudyLanguage(supportedLanguages[0]);
}

function buildPayload(finalTsvConfig?: TsvConfig): FileBasedEpisodeAddPayload | null {
  assert(title.trim().length > 0, 'Title is empty');
  assertNotNull(audioFilePath, 'Audio file path is null');
  assertNotNull(scriptFilePath, 'Script file path is null');
  assertNotNull(selectedStudyLanguage, 'Selected study language is null');

  return {
    source: 'file',
    title: title.trim(),
    audioFilePath,
    scriptFilePath,
    learningLanguage: selectedStudyLanguage,
    tsvConfig: finalTsvConfig,
  };
}

function reset() {
  title = '';
  audioFilePath = null;
  scriptFilePath = null;
  errorMessage = '';
  languageDetectionWarningMessage = '';
  detectedLanguage = null;
  learningTargetLanguages = [];
  selectedStudyLanguage = null;
}

export const fileBasedEpisodeAddStore = {
  get title() {
    return title;
  },
  set title(value: string) {
    title = value;
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

  get errorMessage() {
    return errorMessage;
  },
  set errorMessage(value: string) {
    errorMessage = value;
  },

  get languageDetectionWarningMessage() {
    return languageDetectionWarningMessage;
  },

  get learningTargetLanguages() {
    return learningTargetLanguages;
  },

  get selectedStudyLanguage() {
    return selectedStudyLanguage;
  },
  set selectedStudyLanguage(value: string | null) {
    setSelectedStudyLanguage(value);
  },

  get detectedLanguage() {
    return detectedLanguage;
  },

  completeLanguageDetection,
  failedLanguageDetection,
  buildPayload,
  reset,
} as const;
