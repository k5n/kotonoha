import { t } from '$lib/application/stores/i18n.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { bcp47ToTranslationKey } from '$lib/utils/language';
import { tsvConfigStore } from './tsvConfigStore.svelte';
import { ttsConfigStore } from './ttsConfigStore.svelte';

export type TtsEpisodeAddPayload = {
  readonly source: 'file';
  readonly title: string;
  readonly audioFilePath: string;
  readonly scriptFilePath: string;
  readonly learningLanguage: string;
  readonly tsvConfig?: TsvConfig;
};

let title = $state('');
let scriptFilePath = $state<string | null>(null);
let audioFilePath = $state<string | null>(null);
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

function validateForm(): boolean {
  const titleValue = title.trim();

  if (!titleValue) {
    errorMessage = t('components.fileEpisodeForm.errorTitleRequired');
    return false;
  }

  if (!scriptFilePath) {
    errorMessage = t('components.fileEpisodeForm.errorScriptFileRequired');
    return false;
  }

  if (tsvConfigStore.scriptPreview) {
    if (!tsvConfigStore.isValid) {
      return false;
    }
  }

  if (!selectedStudyLanguage) {
    errorMessage = t('components.fileEpisodeForm.errorLanguageRequired');
    return false;
  }

  errorMessage = '';
  return true;
}

function buildPayload(): TtsEpisodeAddPayload | null {
  const trimmedTitle = title.trim();
  if (!trimmedTitle || !scriptFilePath || !audioFilePath || !selectedStudyLanguage) {
    return null;
  }

  const currentConfig = tsvConfigStore.tsvConfig;
  const finalTsvConfig =
    currentConfig.startTimeColumnIndex !== -1 && currentConfig.textColumnIndex !== -1
      ? {
          startTimeColumnIndex: currentConfig.startTimeColumnIndex,
          textColumnIndex: currentConfig.textColumnIndex,
          ...(currentConfig.endTimeColumnIndex !== -1 && {
            endTimeColumnIndex: currentConfig.endTimeColumnIndex,
          }),
        }
      : undefined;

  return {
    source: 'file',
    title: trimmedTitle,
    audioFilePath,
    scriptFilePath,
    learningLanguage: selectedStudyLanguage,
    tsvConfig: finalTsvConfig,
  };
}

function reset() {
  title = '';
  scriptFilePath = null;
  audioFilePath = null;
  errorMessage = '';
  languageDetectionWarningMessage = '';
  detectedLanguage = null;
  learningTargetLanguages = [];
  selectedStudyLanguage = null;
  tsvConfigStore.reset();
  ttsConfigStore.reset();
}

export const ttsEpisodeAddStore = {
  get title() {
    return title;
  },
  set title(value: string) {
    title = value;
  },

  get scriptFilePath() {
    return scriptFilePath;
  },
  set scriptFilePath(path: string | null) {
    scriptFilePath = path;
    audioFilePath = null;
  },

  get audioFilePath() {
    return audioFilePath;
  },
  set audioFilePath(path: string | null) {
    audioFilePath = path;
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
    setSelectedStudyLanguage(value);
  },

  completeLanguageDetection,
  failedLanguageDetection,
  validateForm,
  buildPayload,
  reset,

  tsv: tsvConfigStore,
  tts: ttsConfigStore,
};
