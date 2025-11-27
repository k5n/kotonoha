import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';

export type TsvConfigController = {
  readonly tsvConfig: TsvConfig;
  readonly finalTsvConfig: TsvConfig | undefined;
  readonly errorMessageKey: string | null;
  readonly startTimeColumnErrorMessageKey: string | null;
  readonly textColumnErrorMessageKey: string | null;
  readonly scriptPreview: ScriptPreview | null;
  readonly isFetchingScriptPreview: boolean;
  readonly isValid: boolean;
  updateConfig: (field: keyof TsvConfig, value: number) => void;
  fetchScriptPreview: (filePath: string) => Promise<void>;
  reset: () => void;
};

export function createTsvConfigController(): TsvConfigController {
  let tsvConfig = $state<TsvConfig>({
    startTimeColumnIndex: -1,
    textColumnIndex: -1,
    endTimeColumnIndex: -1,
  });
  let isFetchingScriptPreview = $state(false);
  let scriptPreview = $state<ScriptPreview | null>(null);
  let errorMessageKey = $state<string | null>(null);
  let startTimeColumnErrorMessageKey = $state<string | null>(null);
  let textColumnErrorMessageKey = $state<string | null>(null);

  const isValid = $derived(
    tsvConfig.startTimeColumnIndex >= 0 &&
      tsvConfig.textColumnIndex >= 0 &&
      tsvConfig.startTimeColumnIndex !== tsvConfig.textColumnIndex
  );

  function validateTsvColumns() {
    const { startTimeColumnIndex, textColumnIndex } = tsvConfig;

    startTimeColumnErrorMessageKey =
      startTimeColumnIndex === -1
        ? 'components.fileEpisodeForm.errorStartTimeColumnRequired'
        : null;

    textColumnErrorMessageKey =
      textColumnIndex === -1 ? 'components.fileEpisodeForm.errorTextColumnRequired' : null;

    if (startTimeColumnIndex >= 0 && startTimeColumnIndex === textColumnIndex) {
      const errorKey = 'components.fileEpisodeForm.errorTsvColumnsMustBeDifferent';
      startTimeColumnErrorMessageKey = errorKey;
      textColumnErrorMessageKey = errorKey;
    }
  }

  function reset() {
    tsvConfig = {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    };
    scriptPreview = null;
    isFetchingScriptPreview = false;
    errorMessageKey = null;
    startTimeColumnErrorMessageKey = null;
    textColumnErrorMessageKey = null;
  }

  async function fetchScriptPreview(filePath: string) {
    isFetchingScriptPreview = true;
    errorMessageKey = null;
    try {
      const preview = await previewScriptFile(filePath);
      scriptPreview = preview;
      validateTsvColumns();
    } catch (error) {
      console.error('Failed to preview TSV script file:', error);
      errorMessageKey = 'components.fileEpisodeForm.errorTsvParse';
      scriptPreview = null;
    } finally {
      isFetchingScriptPreview = false;
    }
  }

  return {
    get tsvConfig() {
      return tsvConfig;
    },

    get finalTsvConfig(): TsvConfig | undefined {
      return tsvConfig.startTimeColumnIndex !== -1 && tsvConfig.textColumnIndex !== -1
        ? {
            startTimeColumnIndex: tsvConfig.startTimeColumnIndex,
            textColumnIndex: tsvConfig.textColumnIndex,
            ...(tsvConfig.endTimeColumnIndex !== -1 && {
              endTimeColumnIndex: tsvConfig.endTimeColumnIndex,
            }),
          }
        : undefined;
    },

    get errorMessageKey() {
      return errorMessageKey;
    },

    get startTimeColumnErrorMessageKey() {
      return startTimeColumnErrorMessageKey;
    },

    get textColumnErrorMessageKey() {
      return textColumnErrorMessageKey;
    },

    get scriptPreview() {
      return scriptPreview;
    },

    get isFetchingScriptPreview() {
      return isFetchingScriptPreview;
    },

    get isValid() {
      return isValid;
    },

    updateConfig(field: keyof TsvConfig, value: number) {
      tsvConfig = {
        ...tsvConfig,
        [field]: value,
      };
      validateTsvColumns();
    },

    fetchScriptPreview,

    reset,
  };
}
