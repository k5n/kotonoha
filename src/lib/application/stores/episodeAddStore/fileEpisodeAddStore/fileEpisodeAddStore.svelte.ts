import { t } from '$lib/application/stores/i18n.svelte';
import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
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
  readonly tsvConfig?: TsvConfig;
  readonly ttsLanguage?: string;
  readonly ttsVoiceName?: string;
  readonly ttsQuality?: string;
};

const store = $state({
  title: '',
  audioFilePath: null as string | null,
  scriptFilePath: null as string | null,
  shouldGenerateAudio: false,
  errorMessage: '',
});

export const fileEpisodeAddStore = {
  get title() {
    return store.title;
  },
  set title(title: string) {
    store.title = title;
  },

  get errorMessage() {
    return store.errorMessage;
  },

  get shouldGenerateAudio() {
    return store.shouldGenerateAudio;
  },
  set shouldGenerateAudio(value: boolean) {
    store.shouldGenerateAudio = value;
  },

  get hasOnlyScriptFile() {
    return !!store.scriptFilePath && !store.audioFilePath;
  },

  get isTxtScriptFile() {
    return store.scriptFilePath?.toLowerCase().endsWith('.txt') ?? false;
  },

  setAudioFilePath(path: string | null) {
    store.audioFilePath = path;
  },

  setScriptFilePath(path: string | null) {
    store.scriptFilePath = path;
  },

  validate(): boolean {
    const title = store.title.trim();
    const audioFilePath = store.audioFilePath;
    const scriptFilePath = store.scriptFilePath;
    const scriptPreview = tsvConfigStore.scriptPreview;
    const tsvConfig = tsvConfigStore.tsvConfig;
    if (!title.trim()) {
      store.errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return false;
    }
    if (!audioFilePath && !store.shouldGenerateAudio) {
      store.errorMessage = t('components.episodeAddModal.errorAudioFileRequired');
      return false;
    }
    if (!scriptFilePath) {
      store.errorMessage = t('components.episodeAddModal.errorScriptFileRequired');
      return false;
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        store.errorMessage = t('components.episodeAddModal.errorTsvColumnRequired');
        return false;
      }
    }
    return true;
  },

  buildPayload(): FileEpisodeAddPayload | null {
    if (!store.title.trim() || !store.audioFilePath || !store.scriptFilePath) {
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
      title: store.title.trim(),
      audioFilePath: store.audioFilePath,
      scriptFilePath: store.scriptFilePath,
      tsvConfig: finalTsvConfig,
    };

    // Add TTS configuration if audio generation is enabled
    if (store.shouldGenerateAudio) {
      return {
        ...payload,
        ttsLanguage: ttsConfigStore.selectedLanguage,
        ttsVoiceName: ttsConfigStore.selectedVoiceName || undefined,
        ttsQuality: ttsConfigStore.selectedQuality,
      };
    }

    return payload;
  },

  reset() {
    store.title = '';
    store.audioFilePath = null;
    store.scriptFilePath = null;
    store.shouldGenerateAudio = false;
    store.errorMessage = '';
    tsvConfigStore.reset();
    ttsConfigStore.reset();
  },

  // Sub stores
  tsv: tsvConfigStore,
  tts: ttsConfigStore,
};
