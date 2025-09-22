import { t } from '$lib/application/stores/i18n.svelte';
import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';

export type TsvConfig = {
  startTimeColumnIndex: number;
  textColumnIndex: number;
  endTimeColumnIndex?: number;
};

export type FileEpisodeFormData = {
  title: string;
  audioFilePath: string | null;
  scriptFilePath: string | null;
  scriptPreview: ScriptPreview | null;
  tsvConfig: {
    startTimeColumnIndex: number;
    textColumnIndex: number;
    endTimeColumnIndex: number;
  };
};

export type YoutubeEpisodeFormData = {
  title: string;
  youtubeUrl: string;
};

/**
 * Validate file-based episode form
 */
export function validateFileEpisodeForm(data: FileEpisodeFormData): string | null {
  if (!data.title.trim()) {
    return t('components.episodeAddModal.errorTitleRequired');
  }

  if (!data.audioFilePath) {
    return t('components.episodeAddModal.errorAudioFileRequired');
  }

  if (!data.scriptFilePath) {
    return t('components.episodeAddModal.errorScriptFileRequired');
  }

  // TSV-specific validation
  if (data.scriptPreview) {
    if (data.tsvConfig.startTimeColumnIndex === -1 || data.tsvConfig.textColumnIndex === -1) {
      return t('components.episodeAddModal.errorTsvColumnRequired');
    }
  }

  return null;
}

/**
 * Validate YouTube-based episode form
 */
export function validateYoutubeEpisodeForm(data: YoutubeEpisodeFormData): string | null {
  if (!data.title.trim()) {
    return t('components.episodeAddModal.errorTitleRequired');
  }

  if (!data.youtubeUrl.trim()) {
    return t('components.episodeAddModal.errorYoutubeUrlRequired');
  }

  return null;
}

/**
 * Build TSV config from form data
 */
export function buildTsvConfig(tsvConfig: {
  startTimeColumnIndex: number;
  textColumnIndex: number;
  endTimeColumnIndex: number;
}): TsvConfig | undefined {
  if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
    return undefined;
  }

  return {
    startTimeColumnIndex: tsvConfig.startTimeColumnIndex,
    textColumnIndex: tsvConfig.textColumnIndex,
    ...(tsvConfig.endTimeColumnIndex !== -1 && {
      endTimeColumnIndex: tsvConfig.endTimeColumnIndex,
    }),
  };
}
