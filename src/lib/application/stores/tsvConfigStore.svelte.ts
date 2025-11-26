import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';

let tsvConfig = $state({
  startTimeColumnIndex: -1,
  textColumnIndex: -1,
  endTimeColumnIndex: -1,
} as TsvConfig);
let isFetchingScriptPreview = $state(false);
let scriptPreview = $state(null as ScriptPreview | null);
let errorMessageKey = $state('');
let startTimeColumnErrorMessageKey = $state('');
let textColumnErrorMessageKey = $state('');

const isValid = $derived(
  tsvConfig.startTimeColumnIndex >= 0 &&
    tsvConfig.textColumnIndex >= 0 &&
    tsvConfig.startTimeColumnIndex !== tsvConfig.textColumnIndex
);

function validateTsvColumns() {
  const { startTimeColumnIndex, textColumnIndex } = tsvConfig;

  if (startTimeColumnIndex === -1) {
    startTimeColumnErrorMessageKey = 'components.fileEpisodeForm.errorStartTimeColumnRequired';
  } else {
    startTimeColumnErrorMessageKey = '';
  }
  if (textColumnIndex === -1) {
    textColumnErrorMessageKey = 'components.fileEpisodeForm.errorTextColumnRequired';
  } else {
    textColumnErrorMessageKey = '';
  }
  if (startTimeColumnIndex >= 0 && startTimeColumnIndex === textColumnIndex) {
    startTimeColumnErrorMessageKey = 'components.fileEpisodeForm.errorTsvColumnsMustBeDifferent';
    textColumnErrorMessageKey = 'components.fileEpisodeForm.errorTsvColumnsMustBeDifferent';
  }
}

export const tsvConfigStore = {
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

  startScriptPreviewFetching() {
    isFetchingScriptPreview = true;
    errorMessageKey = '';
  },

  completeScriptPreviewFetching(preview: ScriptPreview) {
    scriptPreview = preview;
    isFetchingScriptPreview = false;
    validateTsvColumns();
  },

  failedScriptPreviewFetching(errorKey: string) {
    errorMessageKey = errorKey;
    scriptPreview = null;
    isFetchingScriptPreview = false;
  },

  reset() {
    tsvConfig = {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    };
    scriptPreview = null;
    isFetchingScriptPreview = false;
    errorMessageKey = '';
  },
};
