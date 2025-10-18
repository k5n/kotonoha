// i18n functions are used by components; store keeps errorMessage only
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
  set errorMessage(value: string) {
    errorMessage = value;
  },

  get shouldGenerateAudio() {
    return shouldGenerateAudio;
  },
  set shouldGenerateAudio(value: boolean) {
    shouldGenerateAudio = value;
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
