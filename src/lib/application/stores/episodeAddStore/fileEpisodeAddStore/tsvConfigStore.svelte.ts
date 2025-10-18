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

  updateConfig(field: keyof TsvConfig, value: number) {
    tsvConfig = {
      ...tsvConfig,
      [field]: value,
    };
  },

  startScriptPreviewFetching() {
    isFetchingScriptPreview = true;
    errorMessageKey = '';
  },

  completeScriptPreviewFetching(preview: ScriptPreview | null) {
    scriptPreview = preview;
    isFetchingScriptPreview = false;
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
