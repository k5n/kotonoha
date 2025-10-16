/**
 * Payload for the tts-progress event.
 */
export type TtsProgressPayload = {
  progress: number; // 0-100
  startMs: number;
  endMs: number;
  text: string;
};

/**
 * Payload for the tts-finished event.
 */
export type TtsFinishedPayload = {
  mediaPath: string;
};

/**
 * Payload for the tts-error event.
 */
export type TtsErrorPayload = {
  errorMessage: string;
};

/**
 * Progress information for TTS model download.
 */
export type DownloadProgress = {
  readonly fileName: string;
  readonly progress: number; // 0-100
  readonly downloaded: number; // bytes
  readonly total: number; // bytes
};
