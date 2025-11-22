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

const isValid = $derived(
  tsvConfig.startTimeColumnIndex >= 0 &&
    tsvConfig.textColumnIndex >= 0 &&
    tsvConfig.startTimeColumnIndex !== tsvConfig.textColumnIndex
);

function validateTsvColumns() {
  const { startTimeColumnIndex, textColumnIndex } = tsvConfig;

  if (startTimeColumnIndex === -1 && textColumnIndex === -1) {
    errorMessageKey = 'components.fileEpisodeForm.errorTsvColumnRequired';
    return;
  }
  if (startTimeColumnIndex === -1) {
    errorMessageKey = 'components.fileEpisodeForm.errorStartTimeColumnRequired';
    return;
  }
  if (textColumnIndex === -1) {
    errorMessageKey = 'components.fileEpisodeForm.errorTextColumnRequired';
    return;
  }
  if (startTimeColumnIndex === textColumnIndex) {
    errorMessageKey = 'components.fileEpisodeForm.errorTsvColumnsMustBeDifferent';
    return;
  }
}

export const tsvConfigStore = {
  get tsvConfig() {
    return tsvConfig;
  },

  get errorMessageKey() {
    return errorMessageKey;
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
    // Clear error when user updates configuration
    errorMessageKey = '';
  },

  validateTsvColumns,

  startScriptPreviewFetching() {
    isFetchingScriptPreview = true;
    errorMessageKey = '';
  },

  completeScriptPreviewFetching(preview: ScriptPreview | null) {
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
