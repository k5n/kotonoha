import { t } from '$lib/application/stores/i18n.svelte';
import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { bcp47ToTranslationKey } from '$lib/utils/language';

export type AudioScriptFileEpisodeAddPayload = {
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

const tsvStore = tsvConfigStore;

function setSelectedStudyLanguage(language: string | null) {
  selectedStudyLanguage = language;
}

function completeLanguageDetection(
  detectedLanguageCode: string | null,
  supportedLanguages: readonly string[]
) {
  if (supportedLanguages.length === 0) {
    throw new Error('supportedLanguages must contain at least one language');
  }

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
}

function buildPayload(): AudioScriptFileEpisodeAddPayload | null {
  if (!title.trim() || !audioFilePath || !scriptFilePath || !selectedStudyLanguage) {
    return null;
  }

  const tsvConfig = tsvStore.tsvConfig;
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

  return {
    source: 'file',
    title: title.trim(),
    audioFilePath,
    scriptFilePath,
    learningLanguage: selectedStudyLanguage,
    tsvConfig: finalTsvConfig,
  } satisfies AudioScriptFileEpisodeAddPayload;
}

function validateForm(): boolean {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    errorMessage = t('components.fileEpisodeForm.errorTitleRequired');
    return false;
  }

  if (!audioFilePath) {
    errorMessage = t('components.fileEpisodeForm.errorAudioRequired');
    return false;
  }

  if (!scriptFilePath) {
    errorMessage = t('components.fileEpisodeForm.errorScriptFileRequired');
    return false;
  }

  const scriptPreview = tsvStore.scriptPreview;
  const tsvConfig = tsvStore.tsvConfig;
  if (scriptPreview && scriptPreview.rows.length > 0) {
    if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
      errorMessage = t('components.fileEpisodeForm.errorTsvColumnRequired');
      return false;
    }
  }

  errorMessage = '';
  return true;
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
  tsvStore.reset();
}

export const audioScriptFileEpisodeAddStore = {
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
  set selectedStudyLanguage(language: string | null) {
    setSelectedStudyLanguage(language);
  },

  get detectedLanguage() {
    return detectedLanguage;
  },

  completeLanguageDetection,
  failedLanguageDetection,
  buildPayload,
  validateForm,
  reset,

  tsv: tsvStore,
} as const;
