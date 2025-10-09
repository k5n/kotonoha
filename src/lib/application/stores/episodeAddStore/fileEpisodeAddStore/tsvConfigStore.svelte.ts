import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';

const store = $state({
  tsvConfig: {
    startTimeColumnIndex: -1,
    textColumnIndex: -1,
    endTimeColumnIndex: -1,
  } as TsvConfig,
  isFetchingScriptPreview: false,
  scriptPreview: null as ScriptPreview | null,
  errorMessage: '',
});

export const tsvConfigStore = {
  get tsvConfig() {
    return store.tsvConfig;
  },

  get errorMessage() {
    return store.errorMessage;
  },

  get scriptPreview() {
    return store.scriptPreview;
  },

  get isFetchingScriptPreview() {
    return store.isFetchingScriptPreview;
  },

  updateConfig(field: keyof TsvConfig, value: number) {
    store.tsvConfig = {
      ...store.tsvConfig,
      [field]: value,
    };
  },

  startScriptPreviewFetching() {
    store.isFetchingScriptPreview = true;
    store.errorMessage = '';
  },

  completeScriptPreviewFetching(preview: ScriptPreview | null) {
    store.scriptPreview = preview;
    store.isFetchingScriptPreview = false;
  },

  failedScriptPreviewFetching(errorMessage: string) {
    store.errorMessage = errorMessage;
    store.scriptPreview = null;
    store.isFetchingScriptPreview = false;
  },

  reset() {
    store.tsvConfig = {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    };
    store.scriptPreview = null;
    store.isFetchingScriptPreview = false;
    store.errorMessage = '';
  },
};
