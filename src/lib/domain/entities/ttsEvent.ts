/**
 * Payload for the tts-progress event.
 */
export type TtsProgress = {
  progress: number; // 0-100
  startMs: number;
  endMs: number;
  text: string;
};

/**
 * Progress information for TTS model download.
 */
export type DownloadProgress = {
  readonly downloadId: string;
  readonly fileName: string;
  readonly progress: number; // 0-100
  readonly downloaded: number; // bytes
  readonly total: number; // bytes
};
