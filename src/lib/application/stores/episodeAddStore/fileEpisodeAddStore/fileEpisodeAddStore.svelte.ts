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

let title = $state('');
let audioFilePath = $state<string | null>(null);
let scriptFilePath = $state<string | null>(null);
let shouldGenerateAudio = $state(false);
let errorMessage = $state('');

const hasOnlyScriptFile = $derived(!!scriptFilePath && !audioFilePath);
const isTxtScriptFile = $derived(scriptFilePath?.toLowerCase().endsWith('.txt') ?? false);

export const fileEpisodeAddStore = {
  get title() {
    return title;
  },
  set title(value: string) {
    title = value;
  },

  get errorMessage() {
    return errorMessage;
  },

  get shouldGenerateAudio() {
    return shouldGenerateAudio;
  },
  set shouldGenerateAudio(value: boolean) {
    shouldGenerateAudio = value;
  },

  get hasOnlyScriptFile() {
    return hasOnlyScriptFile;
  },

  get isTxtScriptFile() {
    return isTxtScriptFile;
  },

  setAudioFilePath(path: string | null) {
    audioFilePath = path;
  },

  get scriptFilePath() {
    return scriptFilePath;
  },
  set scriptFilePath(path: string | null) {
    scriptFilePath = path;
  },

  validate(): boolean {
    const titleValue = title.trim();
    const audioFilePathValue = audioFilePath;
    const scriptFilePathValue = scriptFilePath;
    const scriptPreview = tsvConfigStore.scriptPreview;
    const tsvConfig = tsvConfigStore.tsvConfig;
    if (!titleValue.trim()) {
      errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return false;
    }
    if (!audioFilePathValue && !shouldGenerateAudio) {
      errorMessage = t('components.episodeAddModal.errorAudioRequired');
      return false;
    }
    if (!scriptFilePathValue) {
      errorMessage = t('components.episodeAddModal.errorScriptFileRequired');
      return false;
    }
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        errorMessage = t('components.episodeAddModal.errorTsvColumnRequired');
        return false;
      }
    }
    return true;
  },

  buildPayload(): FileEpisodeAddPayload | null {
    if (!title.trim() || !audioFilePath || !scriptFilePath) {
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
      title: title.trim(),
      audioFilePath: audioFilePath,
      scriptFilePath: scriptFilePath,
      tsvConfig: finalTsvConfig,
    };

    // Add TTS configuration if audio generation is enabled
    if (shouldGenerateAudio) {
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
    title = '';
    audioFilePath = null;
    scriptFilePath = null;
    shouldGenerateAudio = false;
    errorMessage = '';
    tsvConfigStore.reset();
    ttsConfigStore.reset();
  },

  // Sub stores
  tsv: tsvConfigStore,
  tts: ttsConfigStore,
};
