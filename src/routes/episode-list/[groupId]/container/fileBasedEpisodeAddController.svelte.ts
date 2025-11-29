import { t } from '$lib/application/stores/i18n.svelte';
import type { FileBasedEpisodeAddPayload } from '$lib/application/usecases/addNewEpisode';
import {
  detectScriptLanguage,
  populateLearningTargetLanguages,
} from '$lib/application/usecases/detectScriptLanguage';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { assert, assertNotNull } from '$lib/utils/assertion';
import { bcp47ToTranslationKey } from '$lib/utils/language';

export type FileBasedEpisodeAddController = {
  title: string;
  audioFilePath: string | null;
  scriptFilePath: string | null;
  readonly errorMessage: string;
  readonly languageDetectionWarningMessage: string;
  readonly learningTargetLanguages: readonly string[];
  selectedStudyLanguage: string | null;
  validateTitle: () => string;
  validateAudioFile: () => string;
  validateScriptFile: () => string;
  detectLanguage: (tsvConfig: TsvConfig) => Promise<void>;
  buildPayload: (finalTsvConfig?: TsvConfig) => FileBasedEpisodeAddPayload | null;
  reset: () => void;
};

function applyLanguageSelection(
  detectedLanguageCode: string | null,
  supportedLanguages: readonly string[]
): {
  selectedStudyLanguage: string | null;
  languageDetectionWarningMessage: string;
} {
  if (detectedLanguageCode === null) {
    return {
      selectedStudyLanguage: supportedLanguages[0] ?? null,
      languageDetectionWarningMessage: t('components.fileEpisodeForm.noLanguageDetected'),
    };
  }

  if (supportedLanguages.includes(detectedLanguageCode)) {
    return {
      selectedStudyLanguage: detectedLanguageCode,
      languageDetectionWarningMessage: '',
    };
  }

  const fallback = supportedLanguages[0] ?? null;
  const languageLabel = t(bcp47ToTranslationKey(detectedLanguageCode) || detectedLanguageCode);

  return {
    selectedStudyLanguage: fallback,
    languageDetectionWarningMessage: t('components.fileEpisodeForm.languageNotTargeted', {
      language: languageLabel,
    }),
  };
}

export function createFileBasedEpisodeAddController(): FileBasedEpisodeAddController {
  let title = $state('');
  let audioFilePath = $state<string | null>(null);
  let scriptFilePath = $state<string | null>(null);
  let errorMessage = $state('');
  let languageDetectionWarningMessage = $state('');
  let learningTargetLanguages = $state<readonly string[]>([]);
  let selectedStudyLanguage = $state<string | null>(null);

  function validateTitle(): string {
    const value = title.trim();
    return value ? '' : t('components.fileEpisodeForm.errorTitleRequired');
  }

  function validateAudioFile(): string {
    return audioFilePath ? '' : t('components.fileEpisodeForm.errorAudioRequired');
  }

  function validateScriptFile(): string {
    return scriptFilePath ? '' : t('components.fileEpisodeForm.errorScriptFileRequired');
  }

  function completeLanguageDetection(
    detectedLanguageCode: string | null,
    supportedLanguages: readonly string[]
  ) {
    learningTargetLanguages = supportedLanguages;

    const { selectedStudyLanguage: selected, languageDetectionWarningMessage: warning } =
      applyLanguageSelection(detectedLanguageCode, supportedLanguages);

    selectedStudyLanguage = selected;
    languageDetectionWarningMessage = warning;
    errorMessage = '';
  }

  function failedLanguageDetection(errorKey: string, supportedLanguages: readonly string[]) {
    errorMessage = t(errorKey);
    learningTargetLanguages = supportedLanguages;
    selectedStudyLanguage = supportedLanguages[0] ?? null;
  }

  async function detectLanguage(tsvConfig: TsvConfig) {
    const supportedLanguages = await populateLearningTargetLanguages();
    try {
      const scriptPath = scriptFilePath;
      assertNotNull(scriptPath, 'Script file path is null during language detection');
      const detected = await detectScriptLanguage(scriptPath, tsvConfig);
      completeLanguageDetection(detected, supportedLanguages);
    } catch (error) {
      console.error('Failed to detect script language:', error);
      failedLanguageDetection('components.fileEpisodeForm.errorDetectLanguage', supportedLanguages);
    }
  }

  function buildPayload(finalTsvConfig?: TsvConfig): FileBasedEpisodeAddPayload | null {
    try {
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
    } catch (error) {
      console.error('Failed to build file-based episode payload:', error);
      return null;
    }
  }

  function reset() {
    title = '';
    audioFilePath = null;
    scriptFilePath = null;
    errorMessage = '';
    languageDetectionWarningMessage = '';
    learningTargetLanguages = [];
    selectedStudyLanguage = null;
  }

  return {
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
      selectedStudyLanguage = value;
    },

    validateTitle,
    validateAudioFile,
    validateScriptFile,

    detectLanguage,
    buildPayload,
    reset,
  };
}
