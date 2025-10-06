import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { TtsErrorPayload, TtsFinishedPayload, TtsProgressPayload } from '$lib/domain/entities/ttsEvent';

/**
 * Repository for calling Tauri's TTS commands.
 */
export const ttsRepository = {
  /**
   * Starts the Text-to-Speech (TTS) generation process.
   * This command runs in the background and communicates progress via events.
   * @param transcript - The text to be synthesized.
   * @param configPath - The path to the TTS model config file.
   * @param outputPath - The path where the output audio file will be saved.
   */
  async start(transcript: string, configPath: string, outputPath: string): Promise<void> {
    await invoke('start_tts', { transcript, configPath, outputPath });
  },

  /**
   * Listens for TTS progress updates.
   * @param callback - A function to be called when a progress event is received.
   * @returns A function to stop listening.
   */
  async listenTtsProgress(callback: (payload: TtsProgressPayload) => void): Promise<UnlistenFn> {
    return await listen<TtsProgressPayload>('tts-progress', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Listens for the TTS finished event.
   * @param callback - A function to be called when the TTS process is successfully completed.
   * @returns A function to stop listening.
   */
  async listenTtsFinished(callback: (payload: TtsFinishedPayload) => void): Promise<UnlistenFn> {
    return await listen<TtsFinishedPayload>('tts-finished', (event) => {
      callback(event.payload);
    });
  },

  /**
   * Listens for TTS error events.
   * @param callback - A function to be called when an error occurs during the TTS process.
   * @returns A function to stop listening.
   */
  async listenTtsError(callback: (payload: TtsErrorPayload) => void): Promise<UnlistenFn> {
    return await listen<TtsErrorPayload>('tts-error', (event) => {
      callback(event.payload);
    });
  },
};
