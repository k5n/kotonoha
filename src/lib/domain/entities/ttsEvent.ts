/**
 * Payload for the tts-progress event.
 */
export interface TtsProgressPayload {
  progress: number; // 0-100
  startMs: number;
  endMs: number;
  text: string;
}

/**
 * Payload for the tts-finished event.
 */
export interface TtsFinishedPayload {
  mediaPath: string;
}

/**
 * Payload for the tts-error event.
 */
export interface TtsErrorPayload {
  errorMessage: string;
}
